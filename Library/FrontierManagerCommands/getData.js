const Discord       = require('discord.js');
const RobloxHelper  = require('../RobloxHelper');
const DiscordHelper = require('../DiscordHelper');

module.exports = {
    info : {
        name : 'getdata',
        description : 'Get a full list of a players data.',
        options : [
            {
                name : 'username',
                description : 'Target username.',
                type : Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required : true
            },
            {
                name : 'role',
                description : 'Specify the role you would like to check data for.',
                type : Discord.Constants.ApplicationCommandOptionTypes.STRING,
                required : false
            }
        ]
    },

    run : async interaction => {
        const username = interaction.options.getString('username');
        const roleChosen = interaction.options.getString('role');

        await interaction.deferReply({embeds : [DiscordHelper.loadingEmbed('Validating Request', 'Checking parameters...')], ephemeral : true})

        // Authenticate user
        const authorUserId = await RobloxHelper.getUserIdFromDiscordId(interaction.member.id);
        if (!authorUserId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Get Data Failed', `You are not verified with Bloxlink.`)], ephemeral : true});
            return;
        }
        if (!(await DiscordHelper.authenticate(authorUserId, 'Discord Moderator'))) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Get Data Failed', `Insufficient permissions.`)], ephemeral : true});
            return;
        }
        
        // Get parameters
        const userId = await RobloxHelper.getUserIdFromName(username);
        if (!userId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Get Data Failed', `Invalid username provided.`)], ephemeral : true});
            return;
        }

        // Get data
        await interaction.editReply({embeds : [DiscordHelper.loadingEmbed('Carrying out Request', 'Loading data...')], ephemeral : true});
        let playerData = await RobloxHelper.getPlayerData(username);
        if (!playerData) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Get Data Failed', `Could not load data.`)], ephemeral : true});
            return;
        }

        // Success
        interaction.editReply({embeds : [DiscordHelper.successEmbed('Success', `There are no issues with your request.`)], ephemeral : true});

        let embeds = [new Discord.MessageEmbed().setTitle(`${username} Data`)]
        for (const role of ['Colonist', 'Native', 'Hudson\'s Bay Company']) {
            if (roleChosen && roleChosen != role) continue;
            embeds.push(
                new Discord.MessageEmbed()
                    .setTitle(`${username} ${role}`)
                    .addFields(
                        {
                            name: "Backpack",
                            value: JSON.stringify(playerData[role]['backpack']).replace(/,/g, '\n').replace(/{|}|"/g, '') || 'N/A'
                        },
                        {
                            name: "Equipment",
                            value: JSON.stringify(playerData[role]['equipment']).replace(/,/g, '\n').replace(/{|}|"/g, '') || 'N/A'
                        },
                        {
                            name: "Bank Items",
                            value: JSON.stringify(playerData[role]['bankItems']).replace(/,/g, '\n').replace(/{|}|"/g, '') || 'N/A'
                        },
                        {
                            name: "Pounds",
                            value: JSON.stringify(playerData[role]['pounds']).replace(/,/g, '\n').replace(/{|}|"/g, '') || 'N/A'
                        },
                        {
                            name: "Bank Pounds",
                            value: JSON.stringify(playerData[role]['bankPounds']).replace(/,/g, '\n').replace(/{|}|"/g, '') || 'N/A'
                        },
                        {
                            name: "Bank Storage Space",
                            value: JSON.stringify(playerData[role]['bankStorageSpace']).replace(/,/g, '\n').replace(/{|}|"/g, '') || 'N/A'
                        },
                    )
            )
        }
        interaction.editReply({embeds : embeds, ephemeral : true})
    }
}