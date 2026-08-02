import Contact, { IContact } from "../models/Contact";

export interface ContactCreateInput {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
}

export async function createContact(input: ContactCreateInput): Promise<IContact> {
  return Contact.create(input);
}
