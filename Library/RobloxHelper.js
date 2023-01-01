require('dotenv').config();
const axios = require('axios').default;
const Member = require('../Models/Member.js');

const getUserIdFromName = async name => {
    const response = (await axios.request({
        method: 'GET',
        url: `https://api.roblox.com/users/get-by-username?username=${name}`
    })).data.Id || false
    return response
}

const getUsernameFromUserId = async userId => {
    const response = (await axios.request({
        method: 'GET',
        url: `https://api.roblox.com/users/${userId}`
    })).data.Username || false
    return response
}

const getUserIdFromDiscordId = async discordId => {
    const memberInfo = await Member.findOne({ discord_id: discordId })
    return memberInfo?.roblox_id
}

const getDiscordIdFromUserId = async roblox_id => {
    const memberInfo = await Member.findOne({ roblox_id: roblox_id })
    return memberInfo?.discord_id
}

const getToken = async () => {
    let token
    try {
        await axios.request({
            method: 'POST',
            url: 'https://auth.roblox.com/v2/logout',
            headers: {
                'Cookie' : `.ROBLOSECURITY=${process.env.ROBLOX_COOKIE}`,
            },
        })
    } catch (err) {
        token = err.response.headers['x-csrf-token']
    }
    return token
}

const getRankInGroup = async (userId, groupId) => {
    const response = await axios.default.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`)
    for (const group of response.data.data) {
        if (group.group.id == groupId) {
            return group.role.rank
        }
    }
    return 0
}

const setRank = async (userId, groupId, rankName) => {
    const groupData = (await axios.get(`https://groups.roblox.com/v1/groups/${groupId}/roles`)).data
    let roleId
    for (const role of groupData.roles) {
        if (rankName == role.name) {
            roleId = role.id
        }
    }
    if (!roleId) return;
    await axios.request({
        method: 'PATCH',
        url: `https://groups.roblox.com/v1/groups/${groupId}/users/${userId}`,
        headers: {
            'Cookie' : `.ROBLOSECURITY=${process.env.ROBLOX_COOKIE}`,
            'X-CSRF-TOKEN': await getToken()
        },
        data: {
            'roleId': roleId
        }
    })
}

const getAsync = async (name, scope, key) => {
    let response = {}
    try {
        response = await axios.request({
            method: 'POST',
            url : `https://gamepersistence.roblox.com/persistence/getV2?placeId=${process.env.GAME_ID}&type=standard&scope=${scope}`,
            headers : {
                'Cookie' : `.ROBLOSECURITY=${process.env.ROBLOX_COOKIE}`,
                'Roblox-Place-Id' : `${process.env.GAME_ID}`,
                'Content-Type' : 'application/x-www-form-urlencoded',
                'User-Agent' : 'Roblox/WinInet'
            },
            data : `qkeys[0].scope=${scope}&qkeys[0].target=${key}&qkeys[0].key=${name}`
        })
    } catch (err) {
        console.log(err)
        console.log(name, scope)
        response = await getAsync(name, scope, key)
    }
    if (response && response.data && response.data.data && response.data.data[0] && response.data.data[0].Value) {
        return response.data.data[0].Value
    }
}

const setAsync = async (name, scope, key, value) => {
    try {
        await axios.request({
            method: 'POST',
            url : `https://gamepersistence.roblox.com/persistence/set?placeId=${process.env.GAME_ID}&type=standard&key=${name}&type=standard&scope=${scope}&target=${key}&valueLength=${value.length}`,
            headers : {
                'Cookie' : `.ROBLOSECURITY=${process.env.ROBLOX_COOKIE}`,
                'Roblox-Place-Id' : `${process.env.GAME_ID}`,
                'Content-Type' : 'application/x-www-form-urlencoded',
                'User-Agent' : 'Roblox/WinInet'
            },
            data : `value=${value}`
        })
    } catch (err) {
        console.log(err)
        console.log(name, scope)
        await setAsync(name, scope, key, value)
    }
}

const getPlayerData = async (username) => {
    let playerData = {}
    const userId = await getUserIdFromName(username)
    for (let role of ['Colonist', 'Native', 'Hudson\'s Bay Company', 'Nouvelle-France Company']) {
        playerData[role] = {
            backpack : await getAsync('players_ds', `${userId}_${role}`, 'backpack'),
            equipment : await getAsync('players_ds', `${userId}_${role}`, 'equipment'),
            bankItems : await getAsync('players_ds', `${userId}_${role}`, 'bankItems'),
            pounds : await getAsync('players_ds', `${userId}_${role}`, 'pounds') || 100,
            bankPounds : await getAsync('players_ds', `${userId}_${role}`, 'bankPounds') || 100,
            bankStorageSpace : await getAsync('players_ds', `${userId}_${role}`, 'bankStorageSpace') || 100,
        }
    }

    for (let role of ['Colonist', 'Native', 'Hudson\'s Bay Company']) {
        for (let key of ['backpack', 'equipment', 'bankItems']) {
            if (playerData[role][key]) {
                let obj = {}
                if (playerData[role][key] == 'WIPED') continue;
                for (let item of JSON.parse(playerData[role][key])) {
                    if (obj[item]) {
                        obj[item] = obj[item] + 1
                    } else {
                        obj[item] = 1
                    }
                }
                playerData[role][key] = obj
            } else {
                playerData[role][key] = {}
            }
        }
    }

    return playerData
}

const getRobloxStatus = async userId => {
    const response = (await axios.request({
        method: 'GET',
        url: `https://users.roblox.com/v1/users/${userId}`
    })).data.description || ''
    return response
}

const getGroupRoles = async groupId => {
    return (await axios.get(`https://groups.roblox.com/v1/groups/${groupId}/roles`)).data.roles
}

module.exports = {
    getUserIdFromName,
    getUserIdFromDiscordId,
    getDiscordIdFromUserId,
    getAsync,
    setAsync,
    getPlayerData,
    getRankInGroup,
    getUsernameFromUserId,
    getRobloxStatus,
    setRank,
    getToken,
    getGroupRoles,
};