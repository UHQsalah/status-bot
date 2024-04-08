const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('./config');
const fs = require('node:fs');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
    ],
    partials: [
        1, 2, 5, 3,
        4, 6, 0
    ]
});

const statusEmoji = {
    online: 'emojis_online',
    idle: 'emojis_idle',
    dnd: 'emojis_nepasderanger',
    offline: 'emojis_offline'
};

const staffUsers = config.owner;
const botUsers = config.botid

client.on('ready', async () => {
    console.clear()
client.user.setPresence({
      status: 'dnd',
      activities: [
        {
          name: `Powered by /novaworld`,
          type: 1,
          url: "https://twitch.tv/#"
        },
      ],
    });
    console.log(`Connecté sur ${client.user.tag}`);
    setInterval(() => {
        updateStatus(client);
    }, 15000);
    updateStatus(client);
});

async function updateStatus(client) {
    try {
        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) {
            console.log('Serveur inconnu.');
            return;
        }

        let description = '';
        description += '**Développeurs/Owners**\n';
        description += await getuserstatus(guild, staffUsers);
        description += '\n**Bots**\n';
        description += await getuserstatus(guild, botUsers);
        description += '\n**Dernière Actualisation :**\n';
        description += `<t:${Math.floor(Date.now() / 1000)}:R>`

        const embed = new EmbedBuilder()
            .setTitle('Status')
            .setTimestamp()
            .setColor('Blurple')
            .setDescription(description);

        const channel = client.channels.cache.get(config.channel_id);
        const message = await channel.messages.fetch(config.message_id).catch(() => {});

        if (message) {
            message.edit({ embeds: [embed], content: null });
        } else {
            const sentMessage = await channel.send({ embeds: [embed], content: null });
            config.message_id = sentMessage.id;
            fs.writeFileSync('./config.js', `module.exports = ${JSON.stringify(config, null, 4)}`);
        }
    } catch (error) {
    }
}

async function getuserstatus(guild, userIds) {
    let statusText = '';
    for (const userId of userIds) {
        try {
            const user = await guild.members.fetch(userId);
            const status = user ? statusEmoji[user.presence.status] : statusEmoji.offline;
            let platform = null
            console.log(user.presence.clientStatus)
            if (user && user.presence.clientStatus) {
                const platforms = Object.keys(user.presence.clientStatus);
                if (platforms.length > 0) {
                    switch (platforms[0].toLowerCase()) {
                        case 'desktop':
                            platform = 'PC';
                            break;
                        case 'mobile':
                            platform = 'Mobile';
                            break;
                            case 'web':
                                platform = 'VPS';
                                break;
                        default:
                            platform = platforms[0];
                            break;
                    }
                }
            }

            statusText += `- ${status} [\`${user.displayName}\`](https://discord.com/users/${user.id}) (${platform || 'Offline'})\n`;
        } catch (error) {
            console.error(`Erreur :`, error);
        }
    }
    return statusText;
}


client.login(config.token);
