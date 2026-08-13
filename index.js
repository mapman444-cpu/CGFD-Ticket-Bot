const fs = require('fs');
const path = require('path');
const http = require('http');
const {
    Client,
    Collection,
    GatewayIntentBits,
    ActivityType
} = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

// Log Discord.js version
console.log("Loaded Discord.js version:", require('discord.js').version);

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Global error handlers
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

// Discord client error handlers
client.on('error', (err) => {
    console.error('Discord client error:', err);
});

client.on('shardError', (err) => {
    console.error('Shard error:', err);
});

client.on('disconnect', () => {
    console.warn('Bot disconnected. Attempting to reconnect...');
});

client.on('reconnecting', () => {
    console.log('Bot reconnecting...');
});

// MongoDB connection
if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is missing in your .env file.");
} else {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('📦 Connected to MongoDB'))
        .catch(err => console.error('MongoDB Error:', err));
}

// Command collection
client.commands = new Collection();

// Load prefix commands
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('name' in command && 'execute' in command) {
            client.commands.set(command.name, command);
            console.log(`✔️ Loaded command: ${command.name}`);
        } else {
            console.log(`⚠️ Command at ${filePath} is missing "name" or "execute".`);
        }
    }
} else {
    console.log("⚠️ No 'commands' folder found — skipping command loading.");
}

// Prefix command handler
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const prefix = '-';

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) {
        return message.reply(`❌ Unknown command: ${commandName}`);
    }

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('❌ There was an error while executing this command.');
    }
});

// Bot ready
client.once('ready', () => {
    console.log(`🤖 Bot successfully logged in as ${client.user.tag}`);

    const statuses = [
        {
            name: 'Watching Casa Grande Fire Department Tickets',
            type: ActivityType.Watching
        }
    ];

    let currentStatus = 0;

    const updateStatus = () => {
        client.user.setPresence({
            activities: [statuses[currentStatus]],
            status: 'online'
        });
    };

    updateStatus();
});

// Render keep-alive server
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot is running");
}).listen(PORT, () => {
    console.log(`🌐 Render PORT active on ${PORT}`);
});

// Login
client.login(process.env.TOKEN);
