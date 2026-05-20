/**
 * JsonLd — injects a JSON-LD <script> block into the document head.
 * Pass any valid schema.org object as `data`.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
