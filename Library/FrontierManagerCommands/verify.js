const Discord       = require('discord.js');
const RobloxHelper  = require('../RobloxHelper');
const DiscordHelper = require('../DiscordHelper');
const Member        = require('../../Models/Member.js');

module.exports = {
    info : {
        name : 'verify',
        description : 'Connect your Roblox and Discord accounts.',
        options : [
            {
                name : 'username',
                description : 'Your Roblox username.',
                type : 3,
                required : true
            }
        ]
    },

    run : async (interaction, client) => {
        const username = interaction.options.getString('username');

        await interaction.deferReply({embeds : [DiscordHelper.loadingEmbed('Validating Request', 'Checking parameters...')], ephemeral : true})

        // Validate request
        const userId = await RobloxHelper.getUserIdFromName(username)
        if (!userId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Verification Failed', `This user does not exist.`)], ephemeral : true});
            return;
        }

        // Is user already verified?
        Member.findOne({ discord_id: interaction.member.id }, async (err, memberInfo) => {
            if (err) {
                console.log(err);
                interaction.editReply({embeds : [DiscordHelper.failureEmbed('Verification Failed', `There was an error when searching for you in the database.`)], ephemeral : true});
                return;
            }

            // Already verified on this account
            if (memberInfo) {
                await interaction.member.roles.add([ DiscordHelper.getRoleIdFromName(interaction.guild, 'Verified') ])
                await interaction.member.roles.remove([ DiscordHelper.getRoleIdFromName(interaction.guild, 'Unverified') ])
                interaction.member.setNickname(username)
                interaction.editReply({embeds : [DiscordHelper.successEmbed('Verification Success', `You are already verified with \`${await RobloxHelper.getUsernameFromUserId(memberInfo.roblox_id)}\`.`)], ephemeral : true});
                return;
            }

            // Not verified
            else {
                // Status message
                const statusEmojis = [ '🤔', '👌', '😤', '🤡', '🥇', 'colour', 'economy', 'blue', 'purple', 'friend', 'fan', 'apple', 'synthetic' ]
                let statusMessage = ''
                for (let i = 0; i < 10; i++) {
                    statusMessage = statusMessage + statusEmojis[Math.floor(Math.random()*statusEmojis.length)] + '_'
                }

                interaction.editReply({description: statusMessage, embeds: [
                    new Discord.EmbedBuilder()
                        .setColor("BLUE")
                        .setTitle('Verifying')
                        .setDescription(`Please set your Roblox about me to: \`${statusMessage}\` and click \`Done\` when complete.\n\n*If you don't know how to do this, check the image below.*`)
                        .setImage('https://cdn.discordapp.com/attachments/674333302978773002/919220047128432681/unknown.png')
                        .setFooter({"text": 'This prompt will cancel in 10 minutes.'})
                        .setTimestamp()
                ], components: [
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`VERIFY_${userId}`)
                                .setEmoji('✅')
                                .setLabel('Done')
                                .setStyle('Primary')
                    )
                ], ephemeral: true})

                const buttonCallback = async buttonInteraction => {
                    if (!buttonInteraction.isButton()) return;

                    if (buttonInteraction.customId == `VERIFY_${userId}`) {
                        // Prevent memory leaks
                        client.off('interactionCreate', buttonCallback)

                        // Check status
                        buttonInteraction.deferUpdate()

                        if ((await RobloxHelper.getRobloxStatus(userId)).indexOf(statusMessage) != -1) {
                            // Add user to DB
                            MemberInfo = new Member({
                                discord_id: interaction.member.id,
                                roblox_id: userId,
                            });

                            MemberInfo.save(async err => {
                                if (err) {
                                    console.log(err);
                                    interaction.editReply({embeds : [DiscordHelper.failureEmbed('Verification Failed', `There was an error when saving you to the database.`)], components: [], ephemeral : true});
                                    return;
                                }

                                await interaction.member.roles.add([ DiscordHelper.getRoleIdFromName(interaction.guild, 'Verified') ])
                                await interaction.member.roles.remove([ DiscordHelper.getRoleIdFromName(interaction.guild, 'Unverified') ])
                                interaction.member.setNickname(username)
                                interaction.editReply({embeds : [DiscordHelper.successEmbed('Verification Success', `You have been verified with \`${username}\`.`)], components: [], ephemeral : true});
                            })
                        } else {
                            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Verification Failed', `Required message was not found in your Roblox about me.`)], components : [], ephemeral : true});
                            return;
                        }
                    }
                }

                client.on('interactionCreate', buttonCallback)

                // 10 minute timeout
                setTimeout(() => {
                    interaction.editReply({embeds : [DiscordHelper.failureEmbed('Verification Failed', `The request timed out.`)], ephemeral : true});
                    client.off('interactionCreate', buttonCallback)
                    return;
                }, 1000*10*60)
            }
        })
    }
}