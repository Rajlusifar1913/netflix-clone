declare module 'nodemailer' {
  export interface Transporter {
    sendMail(mailOptions: {
      from?: string;
      to: string;
      subject: string;
      html?: string;
      text?: string;
    }): Promise<unknown>;
  }

  export function createTransport(options: any): Transporter;
  
  const nodemailer: {
    createTransport(options: any): Transporter;
  };
  export default nodemailer;
}

declare module 'supertest' {
  function request(app: any): any;
  export default request;
}
