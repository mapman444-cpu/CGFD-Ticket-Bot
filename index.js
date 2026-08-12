const fs = require('fs');
const path = require('path');
const http = require('http');
const {
    Client,
    Collection,
    GatewayIntentBits,
    REST,
    Routes,
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
        GatewayIntentBits.GuildMessages
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
const commands = [];

// Safe command loader
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        } else {
            console.log(`⚠️ Command at ${filePath} is missing "data" or "execute".`);
        }
    }
} else {
    console.log("⚠️ No 'commands' folder found — skipping command loading.");
}

// Slash command registration
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔄 Refreshing slash commands...');

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log('✅ Slash commands registered successfully.');
    } catch (error) {
        console.error(error);
    }
})();

// Interaction handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`❌ No command found for ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);

        const errorMessage = {
            content: '❌ There was an error while executing this command.',
            ephemeral: true
        };

        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
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
