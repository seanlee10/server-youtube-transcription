#!/usr/bin/env node

import { YoutubeTranscript } from 'youtube-transcript';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const YOUTUBE_TRANSCRIPTION_TOOL = {
    name: "youtube_transcription",
    description: "Extracts transcription from a Youtube video provided by the user",
    inputSchema: {
        type: "object",
        properties: {
            link: {
                type: "string",
                description: "Youtube video link"
            },
        },
        required: ["link"],
    },
};

// Server implementation
const server = new Server({
    name: "@sean.lee/server-youtube-transcription",
    version: "0.0.6",
}, {
    capabilities: {
        tools: {},
    },
});

async function transcribeYoutubeVideo(link) {
    const result = await YoutubeTranscript.fetchTranscript(link);
    const transcript = result.map((item) => item.text).join(' ');
    return transcript;
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [YOUTUBE_TRANSCRIPTION_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        if (!args) {
            throw new Error("No arguments provided");
        }

        switch (name) {
            case "youtube_transcription": {
                const { link } = args;
                const transcript = await transcribeYoutubeVideo(link);
                return {
                    content: [{ type: "text", text: transcript }],
                    isError: false,
                };
            }
            default:
                return {
                    content: [{ type: "text", text: `Unknown tool: ${name}` }],
                    isError: true,
                };
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Youtube Transcription MCP Server running on stdio");
}

runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
