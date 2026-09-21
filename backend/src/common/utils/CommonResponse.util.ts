export function CommonResponse(message: string){
    const res = {
        isSuccess: true,
        data: null,
        message,
    }

    return res;
}