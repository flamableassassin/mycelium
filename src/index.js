const config = require('./config');
const files = require('./util/fileLoader')();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/** @type {import("@prisma/client").Account[]} */
let items = [],
  currentTimeOut;

setInterval(async function () {
  const now = Date.now();
  // ---  runs every 10 mins//
  if (new Date().getMinutes() % 10 === 0) pollDB(prisma, now);
  // --- checking to see if any should have a timeout every min
  else if (items.length !== 0 && items[0].due < now + 60000) {
    createTimeout(prisma);
  }
}, 60000); // 1 min

/**
 * @param {import("@prisma/client").PrismaClient} prisma
 */
async function pollDB(prisma, now = Date.now()) {
  // polling Prisma
  const DBdata = await prisma.account.findMany({
    where: {
      due: {
        lt: now + 600000 // 10 mins 
      },
      active: true
    },
    orderBy: {
      due: 'desc'
    },
    include: {
      subscriptions: true
    }
  });
  if (DBdata.length !== 0) {
    items = DBdata;
    // --- looping through all the reminders to handle all of the ones which have already passed
    while (items.length !== 0 && items[0].due < now) {
      const item = items.shift();
      handle(prisma, item);
    }
    //
    if (items.length !== 0 && items[0].due < now + 60000) {
      createTimeout(prisma);
    }
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
    files.has(items[0].name);
    if (items.length !== 0) {
      handle(prisma, items[0]);
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
 * @param {import("@prisma/client").Account} item
 */
async function handle(prisma, item) {
  if (!files.has(item.source) || item.subscriptions.length === 0) return prisma.account.update({ // disabling the item so that it doesn't waste resources
    where: {
      id: item.id
    },
    data: {
      active: false
    }
  });

  let DBWebhooks = prisma.subscription.findMany({
    where: {
      Accounts: {
        every: {
          id: item.id
        }
      }
    },
    include: {
      webhooks: {
        where: {
          active: true
        }
      }
    }
  });






  let failed = false;
  const file = files.get(item.source);
  /** @type {import("./sources/base").sourceReturn} */
  let res;
  try {
    res = file.run(item, config.plugins[item.source]);
    if (res instanceof Promise) res = await res;
  } catch (e) {
    failed = true;
    console.error('Handler error, ', e, {
      source: item.source,
      accountName: item.name
    });
  }

  if (failed) return;
  DBWebhooks = (await DBWebhooks).flatMap(item => item.webhooks);
  let setWebhooks = sendWebhooks(res.webhooks, DBWebhooks);
  const updateFrequency = Object.prototype.hasOwnProperty.call(item, 'frequency') ? item.frequency : config.defaultFrequency;
  const resData = res.data !== undefined ? res.data : {};
  let resTime = res.time !== undefined ? res.time : item.lastCheck; // Defaulting to last check 

  // fixing problems caused by an invalid dates being returned;
  if (!(resTime instanceof Date) && isNaN(resTime)) resTime = item.lastCheck;

  // updating the model with the new data
  await prisma.account.update({
    where: {
      id: item.id
    },
    data: {
      due: Date.now() + updateFrequency,
      data: resData,
      lastCheck: resTime
    }
  });

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
  const failed = []; // used to findout where any errors are coming from and preventing it in the future and preventing resources from being wasted

  for (let l = 0; l < webhooks.length; l++) { // looping over webhooks from the source

    for (let i = 0; i < DBWebhooks.length; i++) { // looping over webhooks stored in the database
      if (webhooks[l].failed === true) continue;
      let result;
      try {
        result = await webhooks[l].send(DBWebhooks[i].id, DBWebhooks[i].token);
      } catch (e) {
        failed.push({ type: 'body', id: account.source });
        webhooks[l].failed = true; // edting the webhook class so that it can be checked before sending and it also doesn't matter due to the fact that something is wrong with the webhook body
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
        webhooks[l].failed = true; // edting the webhook class so that it can be checked before sending and it also doesn't matter due to the fact that something is wrong with the webhook body
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