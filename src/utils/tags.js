import * as tagApi from "@/api/tag-api";

// eslint-disable-next-line import/prefer-default-export
export async function fetchDedupedTags(source) {
  const tags = await tagApi.getTags({ page: 1, limit: -1, sources: source });
  const dedupedTags = [];
  tags.records.forEach((tag) => {
    const existingTag = dedupedTags.find(
      (t) => t.name === tag.name && t.value === tag.value,
    );
    if (!existingTag) {
      dedupedTags.push(tag);
    }
  });
  return dedupedTags;
}
