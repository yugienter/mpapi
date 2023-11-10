declare module 'http' {
  interface IncomingMessage {
    user?: {
      uid: string;
      roles: string[];
      email: string;
      email_verified: boolean;
    };
  }
}
