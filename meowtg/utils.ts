import {Api} from "telegram";
import Message = Api.Message;

/**
 * Parse string as arguments with detecting quotes
 * @param line String with spaces and '"' quotes
 * @return Array of arguments.
 */
function parseArguments(line: string): string[] {
    let isInQuotes = false;
    let args: string[] = [];
    let buffer = "";

    for (let i = 0; i < line.length; i++) {
        const ch = line.charAt(i);
        switch (ch) {
            case '"':
                if(buffer.length > 0) {
                    args.push(buffer);
                    buffer = "";
                }

                isInQuotes = !isInQuotes;
                break;
            case ' ':
                if(isInQuotes) {
                   buffer += ch;
                } else {
                    args.push(buffer);
                    buffer = "";
                }
                break;
            default:
                buffer += ch;
                break;
        }
    }

    if(buffer.length > 0)
        args.push(buffer);

    return args;
}

function isMyMessage(message: Message): boolean {
    return message.chatId.toString() !== message.senderId.toString();
}

async function showResult(message: Message, output: string) {
    await message.client.editMessage(message.chatId, { message: message.id, text: output, parseMode: "html" })
}

export { parseArguments, isMyMessage, showResult };