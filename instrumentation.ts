
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { Queue } = await import('@/lib/queue');
        const { syncDriveFolderWorker } = await import('@/app/jobs/drive');
        const { generateSeoWorker } = await import('@/app/jobs/seo');
        const { sendInviteWorker } = await import('@/app/jobs/invite');
        const { registerHistoryListeners } = await import('@/app/listeners/history');
        const { registerWorkflowListeners } = await import('@/app/listeners/workflow');

        // Register Workers
        Queue.register('SYNC_DRIVE_FOLDER', syncDriveFolderWorker);
        Queue.register('SEO_GENERATE', generateSeoWorker);
        Queue.register('SEND_INVITE', sendInviteWorker);

        // Register Event Listeners
        registerHistoryListeners();
        registerWorkflowListeners();

        console.log('[Instrumentation] Job Queue initialized and workers registered.');
    }
}
