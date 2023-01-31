export let connectedClients: string[] = [];

export const updateConnectedClients = (updatedData: string[]) => {
    connectedClients = updatedData;
}

