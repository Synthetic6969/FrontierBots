const Discord       = require('discord.js');
const RobloxHelper  = require('../RobloxHelper');
const DiscordHelper = require('../DiscordHelper');

module.exports = {
    info : {
        name : 'giveitem',
        description : 'Give a player an item in-game.',
        options : [
            {
                name : 'username',
                description : 'Target username.',
                type : Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required : true
            },
            {
                name : 'role',
                description : 'The role you want to give the item on.',
                type : Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required : true
            },
            {
                name : 'item',
                description : 'The item you want to give.',
                type : Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required : true
            },
            {
                name : 'reason',
                description : 'Reason of giving the item.',
                type : Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required : true
            }
        ]
    },

    run : async interaction => {
        const username = interaction.options.getString('username');
        const role = interaction.options.getString('role');
        const item = interaction.options.getString('item');
        const reason = interaction.options.getString('reason');

        await interaction.deferReply({embeds : [DiscordHelper.loadingEmbed('Validating Request', 'Checking parameters...')], ephemeral : true})

        // Authenticate user
        const authorUserId = await RobloxHelper.getUserIdFromDiscordId(interaction.member.id);
        if (!authorUserId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Give Item Failed', `You are not verified with Bloxlink.`)], ephemeral : true});
            return;
        }
        const authorUsername = await RobloxHelper.getUsernameFromUserId(authorUserId);
        if (!(await DiscordHelper.authenticate(authorUserId, 'Discord Moderator'))) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Give Item Failed', `Insufficient permissions.`)], ephemeral : true});
            return;
        }

        // Validate arguments
        const userId = await RobloxHelper.getUserIdFromName(username);
        if (!userId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Give Item Failed', `Invalid username provided.`)], ephemeral : true});
            return;
        }
        if (role != "Hudson's Bay Company" && role != 'Native' && role != 'Colonist') {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Give Item Failed', `Invalid role provided. Available roles are \`Colonist\`, \`Native\`, and \`Hudson's Bay Company\`.`)], ephemeral : true});
            return;
        }

        let data = await RobloxHelper.getAsync('players_ds', `${userId}_${role == 'HBC' ? "Hudson's Bay Company" : role}`, 'backpack')
        if (!data) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Give Item Failed', `No player data was found for ${username}.`)], ephemeral : true});
            return;
        }

        // Success
        interaction.editReply({'embeds' : [ DiscordHelper.successEmbed('Success', `Successfully gave ${username} ${item}`) ], ephemeral : true})
        DiscordHelper.logCommand(interaction.guild, 'giveitem', 'Reimbursement', authorUsername, { Target : username, Item : item }, reason)
        
        // Give item
        let newData = JSON.parse(data)
        newData.push(item)
        RobloxHelper.setAsync('players_ds', `${userId}_${role == 'HBC' ? "Hudson's Bay Company" : role}`, 'backpack', JSON.stringify(newData))
    }
}