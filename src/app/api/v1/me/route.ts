import { apiOk, apiOptions, withApiAuth } from "@/lib/api-helpers";

export async function OPTIONS() {
  return apiOptions();
}

export async function GET(req: Request) {
  const a = await withApiAuth(req);
  if (!a.ok) return a.res;
  return apiOk(
    {
      data: {
        workspace: {
          id: a.auth.workspace.id,
          name: a.auth.workspace.name,
          slug: a.auth.workspace.slug,
        },
        api_key: {
          id: a.auth.key.id,
          name: a.auth.key.name,
        },
      },
    },
    { extraHeaders: a.auth.rateHeaders },
  );
}
