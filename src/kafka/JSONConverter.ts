export default function bufferToJson(content: string | Buffer | undefined): any {
    try {
        if (content) {
            if (content instanceof Buffer) {
                content = content.toString();
            }
            return JSON.parse(content);
        }
        return null;
    } catch (error) {
        console.log(error);
        return null;
    }
};