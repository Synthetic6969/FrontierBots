const Discord       = require('discord.js');
const RobloxHelper  = require('../RobloxHelper');
const DiscordHelper = require('../DiscordHelper');

module.exports = {
    info : {
        name : 'ban',
        description : 'Ban a player from the game.',
        options : [
            {
                name : 'username',
                description : 'Target username.',
                type : Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required : true
            },
            {
                name : 'reason',
                description : 'Reason for ban.',
                type : Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required : true
            },
            {
                name : 'time',
                description : 'Number of hours for ban.',
                type : Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
                required : false
            }
        ]
    },

    run : async interaction => {
        const username = interaction.options.getString('username');
        const time = interaction.options.getInteger('time');
        const reason = interaction.options.getString('reason');

        await interaction.deferReply({embeds : [DiscordHelper.loadingEmbed('Validating Request', 'Checking parameters...')], ephemeral : true})

        // Authenticate user
        const authorUserId = await RobloxHelper.getUserIdFromDiscordId(interaction.member.id);
        if (!authorUserId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Ban Failed', `You are not verified with Bloxlink.`)], ephemeral : true});
            return;
        }
        const authorUsername = await RobloxHelper.getUsernameFromUserId(authorUserId);
        if (!(await DiscordHelper.authenticate(authorUserId, 'Administrator'))) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Ban Failed', `Insufficient permissions.`)], ephemeral : true});
            return;
        }

        // Validate arguments
        const userId = await RobloxHelper.getUserIdFromName(username);
        if (!userId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Ban Failed', `Invalid username provided.`)], ephemeral : true});
            return;
        }

        // Success
        interaction.editReply({'embeds' : [ DiscordHelper.successEmbed('Success', `Successfully banned ${username} for ${time || 'N/A'} hours`) ], components : [], ephemeral : true})
        DiscordHelper.logCommand(interaction.guild, 'ban', 'Administration', authorUsername, { Target : username, Time : `${time || 'N/A'} hours` }, reason)
        
        // Add probation
        RobloxHelper.setAsync('players_ds', `${userId}`, 'banned', true)

        // Remove probation
        if (time) {
            setTimeout(() => {
                RobloxHelper.setAsync('players_ds', `${userId}`, 'banned', false)
            }, 60000*60*time)
        }
    }
}