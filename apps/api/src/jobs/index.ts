import boss from '../config/pgboss';

const aJob = 'a-job';

export async function startJobs() {
    await boss.start();
    console.log('pg-boss started');

    // Clear out any existing jobs
    await boss.deleteQueue(aJob);

    // Send a job
    const jobId = await boss.send(aJob, { message: 'Hello from pg-boss!' });
    console.log(`Sent job ${jobId}`);

    // Work on the job
    await boss.work(aJob, async (job) => {
        console.log(`Received job: ${job.id}`);
        console.log(`Data: ${JSON.stringify(job.data)}`);
    });
}
