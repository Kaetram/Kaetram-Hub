let Utils = {};

Utils.formatServerName = (serverId) => {
    // TODO - Make this less hard-coded.
    if (!serverId.startsWith('kaetram_server'))
        return null;

    let serverNumber = parseInt(serverId.split('kaetram_server')[1]);

    return `Kaetram ${serverNumber}`;
};

module.exports = Utils;
