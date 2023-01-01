const Discord       = require('discord.js');
const RobloxHelper  = require('../RobloxHelper');
const DiscordHelper = require('../DiscordHelper');

module.exports = {
    info : {
        name : 'setrank',
        description : 'Set the rank of a discord member.',
        options : [
            {
                name : 'user',
                description : 'Discord mention of the target user.',
                type : 9,
                required : true
            }
        ]
    },

    run : async (interaction, client) => {
        const targetMember = interaction.options.getMentionable('user');

        await interaction.deferReply({embeds : [DiscordHelper.loadingEmbed('Validating Request', 'Checking parameters...')], ephemeral : true})

        // Authenticate user
        const authorUserId = await RobloxHelper.getUserIdFromDiscordId(interaction.member.id);
        if (!authorUserId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Promotion Failed', `You are not verified.`)], ephemeral : true});
            return;
        }
        const authorUsername = await RobloxHelper.getUsernameFromUserId(authorUserId);
        const authorRank = await RobloxHelper.getRankInGroup(authorUserId, process.env.HBC_GROUP_ID)
        if (authorRank < 45) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Promotion Failed', `Insufficient permissions.`)], ephemeral : true});
            return;
        }

        // Check target
        const targetUserId = await RobloxHelper.getUserIdFromDiscordId(targetMember.id)
        if (!targetUserId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Promotion Failed', `User is not verified.`)], ephemeral : true});
            return;
        }
        const targetRank = await RobloxHelper.getRankInGroup(targetUserId, process.env.HBC_GROUP_ID)
        if (targetRank == 0) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Promotion Failed', `User is not in the Roblox group.`)], ephemeral : true});
            return;
        } if (targetRank >= 45) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Promotion Failed', `You are not permitted to rank people above Lieutenant.`)], ephemeral : true});
            return;
        }
        const targetUsername = await RobloxHelper.getUsernameFromUserId(targetUserId)

        // Get rank
        let options = []
        let oldRankName = ''
        for (role of await RobloxHelper.getGroupRoles(process.env.HBC_GROUP_ID)) {
            if (role.rank == targetRank) oldRankName = role.name; 
            if (role.rank < authorRank && role.rank < 45 && role.rank > 1 && role.rank != targetRank) {
                options.push({
                    label: role.name,
                    value: role.name
                })
            }
        }
        const key = Math.floor(Math.random()*1000)
        interaction.editReply({embeds: [ DiscordHelper.promptEmbed('Which rank would you like to give?', false) ], components: [
            new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.StringSelectMenuBuilder()
                        .setCustomId(`SET_RANK_${targetUserId}${authorUserId}${key}`)
                        .setPlaceholder('Select a rank')
                        .setMinValues(1)
                        .setMaxValues(1)
                        .addOptions(options)
            )
        ], ephemeral: true})

        client.on('interactionCreate', async dropdownInteraction => {
            if (!dropdownInteraction.isStringSelectMenu()) return;

            if (dropdownInteraction.customId == `SET_RANK_${targetUserId}${authorUserId}${key}`) {
                const rank = dropdownInteraction.values[0]
                
                // Remove old roles
                await targetMember.roles.remove( DiscordHelper.getRoleIdFromName(interaction.guild, oldRankName) )
                await targetMember.roles.remove( DiscordHelper.getRoleIdFromName(interaction.guild, '[ ' + targetMember.nickname.split('[')[1].replace(']', ' ]') + ' NCO') )
                await targetMember.roles.remove( DiscordHelper.getRoleIdFromName(interaction.guild, '[ ' + targetMember.nickname.split('[')[1].replace(']', ' ]') + ' COM') )
                
                // Add new roles
                let roles = [ DiscordHelper.getRoleIdFromName(interaction.guild, rank) ]
                if (rank == 'Corporal' || rank == 'Sergeant' || rank == 'Master Sergeant' || rank == 'Warrant Officer') {
                    roles.push( DiscordHelper.getRoleIdFromName(interaction.guild, '[ ' + targetMember.nickname.split('[')[1].replace(']', ' ]') + ' NCO') )
                } if (rank == 'Ensign') {
                    roles.push( DiscordHelper.getRoleIdFromName(interaction.guild, '[ ' + targetMember.nickname.split('[')[1].replace(']', ' ]') + ' COM'), )
                }
                targetMember.roles.add( roles )

                // Set rank
                RobloxHelper.setRank(targetUserId, process.env.HBC_GROUP_ID, rank)

                // Reply
                dropdownInteraction.deferUpdate()
                interaction.editReply({'embeds' : [ DiscordHelper.successEmbed('Success', `Successfully ranked ${targetMember} to ${rank}`) ], components : [], ephemeral : true})
                // Log command
                interaction.guild.channels.cache.get('811628563866320936').send({embeds : [
                    new Discord.EmbedBuilder()
                        .setTitle(`${targetUsername} was ranked to ${rank}`)
                        .setDescription(`[${targetUsername}](https://www.roblox.com/profile/${targetUserId}) was ranked to ${rank} by [${authorUsername}](https://www.roblox.com/profile/${authorUserId})`)
                        .setFooter({"text": authorUsername})
                        .setTimestamp()
                ]})
            }
        })
    }
}