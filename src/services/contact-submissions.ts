import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import {
  normalizeContactSubmission,
  normalizeContactSubmissionsResponse,
  type ContactSubmission,
  type ContactSubmissionReplyPayload,
  type ContactSubmissionsParams,
  type ContactSubmissionsResponse,
  type ContactSubmissionStatusPayload,
} from "@/types/contact-submissions";

export const CONTACT_SUBMISSIONS_ENDPOINT = "/contact-submissions";

const normalizeSubmissionFromEnvelope = (response: unknown): ContactSubmission => {
  const source =
    typeof response === "object" &&
    response !== null &&
    !Array.isArray(response) &&
    "data" in response
      ? (response as { data?: unknown }).data
      : response;
  const submission = normalizeContactSubmission(source);

  if (!submission) {
    throw new Error("Invalid contact submission response");
  }

  return submission;
};

export async function getContactSubmissions(
  params: ContactSubmissionsParams
): Promise<ContactSubmissionsResponse> {
  const response = await httpClient.get<unknown>(CONTACT_SUBMISSIONS_ENDPOINT, {
    params: cleanParams(params),
  });

  return normalizeContactSubmissionsResponse(response, params);
}

export async function getContactSubmission(
  id: string
): Promise<ContactSubmission> {
  const response = await httpClient.get<unknown>(
    `${CONTACT_SUBMISSIONS_ENDPOINT}/${id}`
  );

  return normalizeSubmissionFromEnvelope(response);
}

export async function updateContactSubmissionStatus(
  id: string,
  payload: ContactSubmissionStatusPayload
): Promise<ContactSubmission> {
  const response = await httpClient.patch<unknown, ContactSubmissionStatusPayload>(
    `${CONTACT_SUBMISSIONS_ENDPOINT}/${id}/status`,
    payload
  );

  return normalizeSubmissionFromEnvelope(response);
}

export async function replyToContactSubmission(
  id: string,
  payload: ContactSubmissionReplyPayload
): Promise<ContactSubmission> {
  const response = await httpClient.post<unknown, ContactSubmissionReplyPayload>(
    `${CONTACT_SUBMISSIONS_ENDPOINT}/${id}/reply`,
    payload
  );

  return normalizeSubmissionFromEnvelope(response);
}
