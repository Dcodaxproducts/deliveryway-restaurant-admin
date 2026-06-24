import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CONTACT_SUBMISSIONS_ENDPOINT,
  getContactSubmissions,
  replyToContactSubmission,
  updateContactSubmissionStatus,
} from "@/services/contact-submissions";
import { httpClient } from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = vi.mocked(httpClient.get);
const mockedPatch = vi.mocked(httpClient.patch);
const mockedPost = vi.mocked(httpClient.post);

describe("contact submissions service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedPost.mockReset();
  });

  it("lists contact submissions with clean scoped params", async () => {
    mockedGet.mockResolvedValue({
      data: [
        {
          id: "submission-1",
          restaurantId: "restaurant-1",
          branchId: "branch-1",
          name: "John Doe",
          email: "john@example.com",
          subject: "Question",
          message: "Delivery timing?",
          status: "NEW",
          createdAt: "2026-06-24T10:00:00.000Z",
          branch: { id: "branch-1", name: "Main Branch" },
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
      message: "ok",
    });

    const result = await getContactSubmissions({
      page: 1,
      limit: 20,
      restaurantId: "restaurant-1",
      branchId: "",
      status: "",
      search: "john",
    });

    expect(mockedGet).toHaveBeenCalledWith(CONTACT_SUBMISSIONS_ENDPOINT, {
      params: {
        page: 1,
        limit: 20,
        restaurantId: "restaurant-1",
        search: "john",
      },
    });
    expect(result.submissions[0]).toMatchObject({
      id: "submission-1",
      branchId: "branch-1",
      name: "John Doe",
      status: "NEW",
      branch: { id: "branch-1", name: "Main Branch" },
    });
    expect(result.meta.total).toBe(1);
    expect(CONTACT_SUBMISSIONS_ENDPOINT).toBe("/contact-submissions");
  });

  it("updates submission status through the status endpoint", async () => {
    mockedPatch.mockResolvedValue({
      data: {
        id: "submission-1",
        status: "READ",
      },
    });

    const result = await updateContactSubmissionStatus("submission-1", {
      status: "READ",
    });

    expect(mockedPatch).toHaveBeenCalledWith(
      `${CONTACT_SUBMISSIONS_ENDPOINT}/submission-1/status`,
      { status: "READ" }
    );
    expect(result.status).toBe("READ");
  });

  it("sends reply payload through the reply endpoint", async () => {
    mockedPost.mockResolvedValue({
      data: {
        id: "submission-1",
        status: "REPLIED",
        replySubject: "Re: Delivery question",
        replyMessage: "Thanks for contacting us.",
      },
    });

    const result = await replyToContactSubmission("submission-1", {
      subject: "Re: Delivery question",
      message: "Thanks for contacting us.",
    });

    expect(mockedPost).toHaveBeenCalledWith(
      `${CONTACT_SUBMISSIONS_ENDPOINT}/submission-1/reply`,
      {
        subject: "Re: Delivery question",
        message: "Thanks for contacting us.",
      }
    );
    expect(result.status).toBe("REPLIED");
    expect(result.replyMessage).toBe("Thanks for contacting us.");
  });
});
