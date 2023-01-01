const Discord       = require('discord.js');
const RobloxHelper  = require('../RobloxHelper');
const DiscordHelper = require('../DiscordHelper');
const garrisons = require('../../Config/garrisons')

module.exports = {
    info : {
        name : 'recruit',
        description : 'Recruit a discord member into your garrison.',
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
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Recruitment Failed', `You are not verified with Bloxlink.`)], ephemeral : true});
            return;
        }
        const authorUsername = await RobloxHelper.getUsernameFromUserId(authorUserId);
        if ((await RobloxHelper.getRankInGroup(authorUserId, process.env.HBC_GROUP_ID)) < 45) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Recruitment Failed', `Insufficient permissions.`)], ephemeral : true});
            return;
        }

        // Check target
        const targetUserId = await RobloxHelper.getUserIdFromDiscordId(targetMember.id)
        if (!targetUserId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Recruitment Failed', `User is not verified with Bloxlink.`)], ephemeral : true});
            return;
        }
        const targetRank = await RobloxHelper.getRankInGroup(targetUserId, process.env.HBC_GROUP_ID)
        if (targetRank >= 2) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Recruitment Failed', `User is already enlisted.`)], ephemeral : true});
            return;
        } if (targetRank == 0) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Recruitment Failed', `User is not in the Roblox group.`)], ephemeral : true});
            return;
        }
        const targetUsername = await RobloxHelper.getUsernameFromUserId(targetUserId)

        // Get garrison and troop
        let matches = []
        let garrison
        for (const roleName of Object.keys(garrisons.recruitment)) {
            if (interaction.member.roles.cache.find(role => role.name === roleName)) {
                matches.push(roleName)
            }
        }

        const setTroop = async troopInfo => {
            targetMember.setNickname(`${troopInfo.name.replace(/ /g, '')} ${targetUsername}`)
            troopInfo.roles.push('1059126226847023115') // Add frontiersman role
            targetMember.roles.add(troopInfo.roles)
            targetMember.roles.remove('810249114612531200') // Remove Awaiting Placement
            RobloxHelper.setRank(targetUserId, process.env.HBC_GROUP_ID, 'Frontiersman')
            garrison = troopInfo.name
        }

        if (matches.length == 1) {
            setTroop(garrisons.recruitment[matches[0]][0])

            // Reply
            dropdownInteraction.deferUpdate()
            interaction.editReply({'embeds' : [ DiscordHelper.successEmbed('Success', `Successfully recruited ${targetMember} into ${garrison}`) ], components : [], ephemeral : true})
            // Log command
            interaction.guild.channels.cache.get('917175272481095790').send({embeds : [
                new Discord.EmbedBuilder()
                    .setTitle(`${targetUsername} was recruited into ${garrison}`)
                    .setDescription(`[${targetUsername}](https://www.roblox.com/profile/${targetUserId}) was recruited into ${garrison} by [${authorUsername}](https://www.roblox.com/profile/${authorUserId})`)
                    .setFooter({"text": authorUsername})
                    .setTimestamp()
            ]})
        } else {
            let options = []
            for (match of matches) {
                if (garrisons.recruitment[match][0] != 'PRIORITY') continue;
                for (const troopInfo of garrisons.recruitment[match]) {
                    if (troopInfo == 'PRIORITY') continue;
                    options.push({
                        label: troopInfo.name,
                        value: troopInfo.name
                    })
                }
            }
            interaction.editReply({embeds: [ DiscordHelper.promptEmbed('Which troop would you like to recruit to?', false) ], components: [
                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.StringSelectMenuBuilder()
                            .setCustomId(`RECRUIT_${targetUserId}${authorUserId}`)
                            .setPlaceholder('Select a troop')
                            .setMinValues(1)
                            .setMaxValues(1)
                            .addOptions(options)
                    )
            ], ephemeral: true})
        }

        const dropdownCallback = dropdownInteraction => {
            if (!dropdownInteraction.isStringSelectMenu()) return;

            if (dropdownInteraction.customId == `RECRUIT_${targetUserId}${authorUserId}`) {
                // Prevent memory leaks
                event.off('interactionCreate', dropdownCallback)

                const troopInfo = garrisons.recruitment[dropdownInteraction.values[0]][0]
                setTroop(troopInfo)

                // Reply
                dropdownInteraction.deferUpdate()
                interaction.editReply({'embeds' : [ DiscordHelper.successEmbed('Success', `Successfully recruited ${targetMember} into ${garrison}`) ], components : [], ephemeral : true})
                // Log command
                interaction.guild.channels.cache.get('917175272481095790').send({embeds : [
                    new Discord.EmbedBuilder()
                        .setTitle(`${targetUsername} was recruited into ${garrison}`)
                        .setDescription(`[${targetUsername}](https://www.roblox.com/profile/${targetUserId}) was recruited into ${garrison} by [${authorUsername}](https://www.roblox.com/profile/${authorUserId})`)
                        .setFooter({"text": authorUsername})
                        .setTimestamp()
                ]})
            }
        }

        const event = client.on('interactionCreate', dropdownCallback)

        // 10 minute timeout
        setTimeout(() => {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Recruitment Failed', `The request timed out.`)], ephemeral : true});
            event.off('interactionCreate', dropdownCallback)
            return;
        }, 1000*10*60)
    }
}