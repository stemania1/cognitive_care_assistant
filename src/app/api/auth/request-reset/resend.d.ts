// Minimal type stub to satisfy Next.js type-checker when 'resend' is not installed in certain envs
declare module "resend" {
  export class Resend {
    constructor(apiKey: string);
    emails: { send(input: { from: string; to: string | string[]; subject: string; html: string }): Promise<any> };
  }
}


