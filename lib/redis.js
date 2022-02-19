const { Client, Entity, Schema, Repository } = require('redis-om');

const client = new Client();

async function connect() {
    if (!client.isOpen()) {
        await client.open(`redis://:${process.env.REDIS_PASS}@${process.env.REDIS_URL}`)
    }
}

class Room extends Entity { }

let schema = new Schema(
    Room,
    {
        createdAt: { type: 'string' },
        id: { type: 'string', textSearch: true },
        ip: { type: 'string' },
        announcedIp: { type: 'string', textSearch: true },
    }, {
        dataStructure: 'JSON'
    }
)

exports.removeRoom = async function (id) {
    await connect();
    const repo = new Repository(schema, client);

    await repository.remove(id);
}
