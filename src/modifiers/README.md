## About this directory

This directory holds file which can modify the webhooks before they are sent. I want to build out a system that will allow you to modify the source input/output at different points of the process, such as post fetching of the data and post parsing (heavly inspired by fastifys hook system https://www.fastify.io/docs/latest/Reference/Hooks/).

#### Why?

When I oringally built this system for my client they wanted me to add a twitter bot to it and so I did. However, the bot was tweeting every 30 minutes and was filling up the chat. I added a little modifier to the twitter source file so that it would fetch every 4 hours and would remove all tweets bar 1. This system worked for me internally. But, it wouldn\'t work for an open source project, because I don't think its necessary to alter the source files for something niche. With this basic modifiers system I\'m able to actually add more, internally I'm going to use this system to allow me add more embeds with comments.
