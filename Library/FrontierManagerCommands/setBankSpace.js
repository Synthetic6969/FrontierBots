const Discord       = require('discord.js');
const RobloxHelper  = require('../RobloxHelper');
const DiscordHelper = require('../DiscordHelper');

module.exports = {
    info : {
        name : 'setbankspace',
        description : 'Set the bank space of a player.',
        options : [
            {
                name : 'username',
                description : 'Target username.',
                type : 3,
                required : true
            },
            {
                name : 'role',
                description : 'The role you want to set bank space on.',
                type : 3,
                required : true
            },
            {
                name : 'amount',
                description : 'Amount of bank space to set.',
                type : 4,
                required : true
            },
            {
                name : 'reason',
                description : 'Reason of giving the item.',
                type : 3,
                required : true
            }
        ]
    },

    run : async interaction => {
        const username = interaction.options.getString('username');
        const role = interaction.options.getString('role');
        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason');

        await interaction.deferReply({embeds : [DiscordHelper.loadingEmbed('Validating Request', 'Checking parameters...')], ephemeral : true})

        // Authenticate user
        const authorUserId = await RobloxHelper.getUserIdFromDiscordId(interaction.member.id);
        if (!authorUserId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Set Bank Space Failed', `You are not verified with Bloxlink.`)], ephemeral : true});
            return;
        }
        const authorUsername = await RobloxHelper.getUsernameFromUserId(authorUserId);
        if (!(await DiscordHelper.authenticate(authorUserId, 'Moderator'))) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Set Bank Space Failed', `Insufficient permissions.`)], ephemeral : true});
            return;
        }

        // Validate arguments
        const userId = await RobloxHelper.getUserIdFromName(username);
        if (!userId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Set Bank Space Failed', `Invalid username provided.`)], ephemeral : true});
            return;
        }
        if (role != "Hudson's Bay Company" && role != 'Native' && role != 'Colonist') {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Set Bank Space Failed', `Invalid role provided. Available roles are \`Colonist\`, \`Native\`, and \`Hudson's Bay Company\`.`)], ephemeral : true});
            return;
        }

        let data = await RobloxHelper.getAsync('players_ds', `${userId}_${role == 'HBC' ? "Hudson's Bay Company" : role}`, 'bankspace')

        // Success
        interaction.editReply({'embeds' : [ DiscordHelper.successEmbed('Success', `Successfully set ${username}'s bank space to ${amount} on their ${role} role`) ], ephemeral : true})
        DiscordHelper.logCommand(interaction.guild, 'setbankspace', 'Reimbursement', authorUsername, { Target : username, Role : role, Amount : amount, OldBankSpace : data }, reason)
        
        // Give item
        RobloxHelper.setAsync('players_ds', `${userId}_${role == 'HBC' ? "Hudson's Bay Company" : role}`, 'bankspace', amount)
    }
}