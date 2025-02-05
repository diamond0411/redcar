export class HistoryDTO {
    userID: string;
    prompt: string;
    response: string;
    constructor(userID: string, prompt: string, response: string) {
        this.userID = userID;
        this.prompt = prompt;
        this.response = response;
    }
}