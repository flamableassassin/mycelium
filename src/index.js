const config = require('./config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.dbURL
    }
  }
});

const { source: sourceFiles, modifiers: modifiersFiles } = require('./util/fileLoader');
const files = sourceFiles();
const modifiers = modifiersFiles();
const { Status: statusEnums } = require('@prisma/client');

// Altering the account object to include the job ID so that it isn't storing unnecessary data on the heap
// The first item in the array is the one which is due next and so on
/** @type {item[]} */
let items = [];
let currentTimeOut;

setInterval(async function () {
  const now = Date.now();
  // ---  runs every 10 mins//
  if (new Date().getMinutes() % 10 === 0) pollDB(prisma, now);
  // --- checking to see if any should have a timeout every min
  else if (items.length !== 0 && items[0].due < now + 60000) {
    createTimeout(prisma);
  }
}, 60000); // 1 min


// TODO: Check to see if the timeout is being cleared on each poll
/**
 * @param {import("@prisma/client").PrismaClient} prisma
 */
async function pollDB(prisma, now = Date.now()) {
  // polling Prisma
  /** @type {(import("@prisma/client").Job & {account: import("@prisma/client").Account})[]} */
  const dbData = await prisma.job.findMany({
    where: {
      due: {
        lt: now + 600000 // 10 mins 
      },
      status: statusEnums.pending
    },
    orderBy: {
      due: 'desc'
    },
    include: {
      account: true
    }
  });
  if (dbData.length === 0) return;

  items = [];

  const alreadyPassed = [];
  for (let i = 0; i < dbData.length; i++) {
    const item = {
      ...dbData[i].account,
      jobID: dbData[i].id,
      due: dbData[i].due
    };
    if (dbData[i].due < now) alreadyPassed.push(item);
    else items.push(item);
  }

  // --- looping through all the items which have already passed
  await prisma.job.updateMany({
    where: {
      OR: alreadyPassed.map((item) => ({ id: item.jobID })),
      AND: {
        status: statusEnums.pending
      }
    },
    data: {
      status: statusEnums.inprogress
    }
  });

  for (let i = 0; i < alreadyPassed.length; i++) {
    const item = alreadyPassed[i];
    handler(prisma, item, config);
    alreadyPassed[i];
  }


  if (items.length !== 0 && items[0].due < now + 60000) {
    createTimeout(prisma);
  }
}


/**
 * A function used to create timeouts.
 * @param {import("@prisma/client").PrismaClient} prisma
 */
function createTimeout(prisma) {
  const timer = items[0];
  const now = Date.now();
  // clearing old timeout so that only 1 timeout is running at a time
  clearTimeout(currentTimeOut);
  currentTimeOut = setTimeout(function (prisma) {
    if (items.length !== 0) {

      handler(prisma, items[0], config);
      items.shift();
    }
    if (items.length !== 0 && items[0].due < now + 60000) {
      createTimeout(prisma);
    }
  }, timer.due - now, prisma);
}



// TODO: fucking finish this shet
/**
 * @param {import("@prisma/client").PrismaClient} prisma
 * @param {import("./index").item} item
 * @param {import("./config")} config
 */
async function handler(prisma, item, config) {
  if (!files.has(item.source)) return prisma.account.update({
    where: {
      id: item.id
    },
    data: {
      active: false,
      jobs: {
        update: {
          where: {
            id: item.jobID
          },
          data: {
            status: statusEnums.failed,
            error: 'Invalid source'
          }
        }
      }
    }
  });

  const webhooks = await prisma.webhook.findMany({
    where: {
      accounts: {
        every: {
          id: item.id
        }
      }
    }
  });

  if (webhooks.length === 0) return prisma.account.update({
    where: {
      id: item.id
    },
    data: {
      active: false,
      jobs: {
        update: {
          where: {
            id: item.jobID
          },
          data: {
            status: statusEnums.error,
            error: 'No webhooks linked to account'
          }
        }
      }
    }
  });



  let failed = false;
  const file = files.get(item.source);
  /** @type {import("./sources/base").sourceReturn} */
  let res;
  try {
    res = await file.execute(item, webhooks, config.plugins[item.source]);

    if (res.items.length !== 0 && modifiers.has(item.source + '-' + item.name)) res = await (modifiers.get(item.source + '-' + item.name)).execute(res.items, webhooks, config.plugins[item.source]);

  } catch (e) {
    failed = true;
    console.error('Handler error, ', e, {
      source: item.source,
      accountName: item.name
    });
  }



  let setWebhooks = sendWebhooks(res.webhooks, webhooks);

  const updateFrequency = item.hasOwn('frequency') ? item.frequency : config.defaultFrequency;
  const resData = res.data !== undefined ? res.data : {};
  let resTime = res.time !== undefined ? res.time : item.lastCheck; // Defaulting to last check 

  // fixing problems caused by an invalid dates being returned;
  if (!(resTime instanceof Date) && isNaN(resTime)) resTime = item.lastCheck;

  /** @type {import("@prisma/client").Prisma.AccountUpdateArgs} */
  const query = {
    where: {
      id: item.id
    },
    data: {
      lastCheck: resTime,
      data: resData
    }
  };


  if (failed) query.data.jobs = {
    update: {
      where: {
        id: item.jobID
      },
      data: {
        status: statusEnums.error,
        error: 'Failed to execute. Check error logs'
      }
    }
  };
  else query.data.jobs = {
    delete: {
      id: item.jobID
    },
    create: {
      data: {
        status: statusEnums.pending,
        due: Date.now() + updateFrequency
      }
    }
  };

  /*
  making sure that the updateFrequency is less than 10 mins if it is below 10 mins its added to the upcoming checks
  and if the updateFrequency is less than 1 min it becomes a timeout
*/
  if (updateFrequency < 600000) {
    items.push(item);
    if (items.length !== 1) items.sort((first, second) => first.due - second.due);
    if (updateFrequency < 60000) createTimeout(prisma);
  }

  // deleting any 
  setWebhooks = await setWebhooks;
  if (setWebhooks.length === 0) return;

  // deleting any webhooks which returned 404
  await prisma.webhook.deleteMany({
    where: {
      OR: (await setWebhooks).filter(i => i.type === 'webhook').map(i => ({ id: i }))
    }
  });

  // deactivating webhooks which returned 401
  await prisma.webhook.updateMany({
    where: {
      OR: (await setWebhooks).filter(i => i.type === 'webhook-token').map(i => ({ id: i }))
    },
    data: {
      active: false
    }
  });
}



/**
 * Sends the webhooks to discord webhooks 
 * @async
 * @param {import("./util/Webhook")[]} webhooks
 * @param {import("@prisma/client").Webhook[]} DBWebhooks
 * @param {import("@prisma/client").Account} account
 * @returns {Promise<failedWebhooks[]>}
 */
async function sendWebhooks(webhooks, DBWebhooks, account) { // eslint-disable-line no-unused-vars 
  const failed = []; // used to find out where any errors are coming from and preventing it in the future and preventing resources from being wasted

  for (let l = 0; l < webhooks.length; l++) { // looping over webhooks from the source

    for (let i = 0; i < DBWebhooks.length; i++) { // looping over webhooks stored in the database
      if (webhooks[l].failed === true) continue;
      let result;
      try {
        result = await webhooks[l].send(DBWebhooks[i].id, DBWebhooks[i].token);
      } catch (e) {
        failed.push({ type: 'body', id: account.source });
        webhooks[l].failed = true; // editing the webhook class so that it can be checked before sending and it also doesn't matter due to the fact that something is wrong with the webhook body
        console.error(e);
        continue;
      }

      if (result.status === 404) {
        failed.push({ type: 'webhook', id: DBWebhooks[i].id });
        console.warn(`Webhook deleted. ID: ${DBWebhooks[i].id}, SUB-ID: ${DBWebhooks[i].subscriptionId}`);
        break; // breaking because the webhook doesn't exist

      } else if (result.status === 401) {
        failed.push({ type: 'webhook-token', id: DBWebhooks[i].id });
        console.warn(`Incorrect webhook token. Webhook ID: ${DBWebhooks[i].id}, SUB-ID: ${DBWebhooks[i].subscriptionId}`);
        break; // breaking because the token is incorrect

      } else if (result.status === 400) {
        const body = result.text();
        failed.push({ type: 'body', id: account.source });
        webhooks[l].failed = true; // editing the webhook class so that it can be checked before sending and it also doesn't matter due to the fact that something is wrong with the webhook body
        console.warn(`Incorrect body from source. Source ${account.source}, Res Body: ${await body}`);

      } else if (!result.ok) console.error(result.text());
    }
  }
}

/**
 * @typedef failedWebhooks
 * @property {String} type Where it failed E.g. body
 * @property {String} id Away to single out where the problem came from such as the webhook id
 */




/**
 * @typedef {(import("@prisma/client").Account & {jobID: String, due: Date})} item
 */