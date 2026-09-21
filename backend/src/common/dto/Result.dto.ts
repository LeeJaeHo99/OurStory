export class Result<T> {
    isSuccess!: boolean;
    data!: T | null;
    message!: string;
}
