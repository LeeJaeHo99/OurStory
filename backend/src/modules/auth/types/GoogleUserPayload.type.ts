import { Provider } from "../../users/enums/Provider.enum.js";

export interface GoogleUserPayload {
    provider: Provider;
    providerId: string;
    email: string;
    nickname: string;
}