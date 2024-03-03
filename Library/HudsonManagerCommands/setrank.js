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
        const hbcGroupRoles = await RobloxHelper.getGroupRoles(process.env.HBC_GROUP_ID)
        let options = []
        let oldRankName = ''
        for (role of hbcGroupRoles) {
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

        const dropdownCallback = async dropdownInteraction => {
            if (!dropdownInteraction.isStringSelectMenu()) return;

            if (dropdownInteraction.customId == `SET_RANK_${targetUserId}${authorUserId}${key}`) {
                // Prevent memory leaks
                client.off('interactionCreate', dropdownCallback)

                const newRole = dropdownInteraction.values[0]

                const finaliseSetRank = async () => {
                    // Remove old roles
                    await targetMember.roles.remove( [
                        DiscordHelper.getRoleIdFromName(interaction.guild, oldRankName),
                        DiscordHelper.getRoleIdFromName(interaction.guild, '[ ' + targetMember.nickname.split('[')[1].replace(']', ' ]') + ' NCO'),
                        DiscordHelper.getRoleIdFromName(interaction.guild, '[ ' + targetMember.nickname.split('[')[1].replace(']', ' ]') + ' COM')
                    ])
                    
                    // Add new roles
                    let roles = [ DiscordHelper.getRoleIdFromName(interaction.guild, newRole) ]
                    if (newRole == 'Corporal' || newRole == 'Sergeant' || newRole == 'Master Sergeant' || newRole == 'Warrant Officer') {
                        roles.push( DiscordHelper.getRoleIdFromName(interaction.guild, '[ ' + targetMember.nickname.split('[')[1].replace(']', ' ]') + ' NCO') )
                    } if (newRole == 'Ensign') {
                        roles.push( DiscordHelper.getRoleIdFromName(interaction.guild, '[ ' + targetMember.nickname.split('[')[1].replace(']', ' ]') + ' COM'), )
                    }
                    targetMember.roles.add( roles )

                    // Set rank
                    RobloxHelper.setRank(targetUserId, process.env.HBC_GROUP_ID, newRole)

                    // Reply
                    interaction.editReply({'embeds' : [ DiscordHelper.successEmbed('Success', `Successfully ranked ${targetMember} to ${newRole}`) ], components : [], ephemeral : true})
                    // Log command
                    const oldRole = hbcGroupRoles.filter(roleData => roleData.rank == targetRank)[0]?.name
                    const newRank = hbcGroupRoles.filter(roleData => roleData.name == newRole)[0]?.rank
                    const isPromotion = targetRank < newRank
                    interaction.guild.channels.cache.get('811628563866320936').send({embeds : [
                        new Discord.EmbedBuilder()
                            .setTitle(isPromotion ? "__Promotion__" : "__Demotion__")
                            .addFields([
                                {
                                    "name": "Ranked User",
                                    "value": `> **ROBLOX:** [${targetUsername}](https://www.roblox.com/profile/${targetUserId})\n > **Discord:** <@${targetMember.id}>`
                                },
                                {
                                    "name": "Rank Info",
                                    "value": `> \`${oldRole}\` -> \`${newRole}\``
                                },
                                {
                                    "name": "Ranking Officer",
                                    "value": `> **ROBLOX:** [${authorUsername}](https://www.roblox.com/profile/${authorUserId})\n > **Discord:** <@${interaction.member.id}>`
                                },
                            ])
                            .setColor(isPromotion ? Discord.Colors.Green : Discord.Colors.Red)
                            .setFooter({"text": authorUsername})
                            .setTimestamp()
                    ]})
                }

                // Check if AUX
                const tokenisedNickname = targetMember.nickname.split(']').map(a => a.replace('[',''))
                if (tokenisedNickname.length > 2 && tokenisedNickname[1] == "AUX") {
                    const company = tokenisedNickname[0]

                    let options = []
                    for (role of interaction.guild.roles.cache) {
                        if (role[1].name.includes("[ " + company + " ]") && !role[1].name.includes("NCO") && !role[1].name.includes("COM") && !role[1].name.includes("AUX")) {
                            options.push({
                                label: role[1].name,
                                value: role[1].name
                            })
                        }
                    }
                    interaction.editReply({embeds: [ DiscordHelper.promptEmbed('This user is a member of the auxilliary. What platoon would you like to recruit them to?', false) ], components: [
                        new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.StringSelectMenuBuilder()
                                    .setCustomId(`SET_RANK_AUX_${targetUserId}${authorUserId}${key}`)
                                    .setPlaceholder('Select a platoon')
                                    .setMinValues(1)
                                    .setMaxValues(1)
                                    .addOptions(options)
                        )
                    ], ephemeral: true})

                    const auxDropdownCallback = async auxDropdownInteraction => {
                        if (!auxDropdownInteraction.isStringSelectMenu()) return;

                        if (auxDropdownInteraction.customId == `SET_RANK_AUX_${targetUserId}${authorUserId}${key}`) {
                            // Prevent memory leaks
                            client.off('interactionCreate', auxDropdownCallback)

                            // Set nickname
                            await targetMember.setNickname(`${auxDropdownInteraction.values[0].replace(/ /g, '')} ${targetUsername}`)

                            // Set roles
                            await targetMember.roles.remove( DiscordHelper.getRoleIdFromName(interaction.guild, '[ ' + company + ' ] [ AUX ]') )
                            await targetMember.roles.add( DiscordHelper.getRoleIdFromName(interaction.guild, auxDropdownInteraction.values[0]) )

                            // Finalise
                            auxDropdownInteraction.deferUpdate()
                            finaliseSetRank()
                        }
                    }

                    client.on('interactionCreate', auxDropdownCallback)
                    dropdownInteraction.deferUpdate()

                    // 10 minute timeout
                    setTimeout(() => {
                        interaction.editReply({embeds : [DiscordHelper.failureEmbed('Set Rank Failed', `The request timed out.`)], ephemeral : true});
                        client.off('interactionCreate', auxDropdownCallback)
                        return;
                    }, 1000*10*60)
                } else {
                    dropdownInteraction.deferUpdate()
                    finaliseSetRank()
                }
            }
        }

        client.on('interactionCreate', dropdownCallback)

        // 10 minute timeout
        setTimeout(() => {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Set Rank Failed', `The request timed out.`)], ephemeral : true});
            client.off('interactionCreate', dropdownCallback)
            return;
        }, 1000*10*60)
    }
}