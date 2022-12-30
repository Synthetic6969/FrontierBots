const Discord       = require('discord.js');
const RobloxHelper  = require('../RobloxHelper');
const DiscordHelper = require('../DiscordHelper');

module.exports = {
    info : {
        name : 'wipedata',
        description : 'Wipe all the data of a player.',
        options : [
            {
                name : 'username',
                description : 'Target username.',
                type : Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required : true
            },
            {
                name : 'reason',
                description : 'Reason for wiping the player.',
                type : Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required : true
            }
        ]
    },

    run : async interaction => {
        const username = interaction.options.getString('username');
        const reason = interaction.options.getString('reason');

        await interaction.deferReply({embeds : [DiscordHelper.loadingEmbed('Validating Request', 'Checking parameters...')], ephemeral : true})

        // Authenticate user
        const authorUserId = await RobloxHelper.getUserIdFromDiscordId(interaction.member.id);
        if (!authorUserId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Wipe Data Failed', `You are not verified with Bloxlink.`)], ephemeral : true});
            return;
        }
        const authorUsername = await RobloxHelper.getUsernameFromUserId(authorUserId);
        if (!(await DiscordHelper.authenticate(authorUserId, 'Administrator'))) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Wipe Data Failed', `Insufficient permissions.`)], ephemeral : true});
            return;
        }

        // Validate arguments
        const userId = await RobloxHelper.getUserIdFromName(username);
        if (!userId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Wipe Data Failed', `Invalid username provided.`)], ephemeral : true});
            return;
        }

        let data = await RobloxHelper.getPlayerData(username)

        // Success
        interaction.editReply({'embeds' : [ DiscordHelper.successEmbed('Success', `Successfully wiped ${username}`) ], ephemeral : true})
        DiscordHelper.logCommand(interaction.guild, 'wipedata', 'Administration', authorUsername, { Target : username }, reason, new Discord.MessageAttachment(Buffer.from(JSON.stringify(data)), 'data.json'))
        
        // Wipe data
        for (const role in data) {
            for (const key in data[role]) {
                if (data[role][key]) {
                    RobloxHelper.setAsync('players_ds', `${userId}_${role}`, key, 'WIPED')
                }
            }
        }
    }
}