import dotenv from 'dotenv';
dotenv.config();

const defaultToken = Buffer.from('bnRuXzY3MDg0MzUyNTkxNlVtUU11VnZBRzZ0ZEFoRGt1bmthckw3eTIwMFljTnQzV2I=', 'base64').toString('utf-8');
const token = process.env.NOTION_TOKEN || defaultToken;
const databaseId = process.env.NOTION_DATABASE_ID || '41cf9e89-fc4f-80d2-9ef9-d7138a59c09b';

const NOTION_HEADERS = {
  'Authorization': `Bearer ${token}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json'
};

export async function getPublishedArticles(category = null) {
  try {
    const filters = [
      {
        property: 'Published',
        checkbox: {
          equals: true
        }
      },
      {
        or: [
          {
            property: 'Language',
            select: {
              equals: 'VI'
            }
          },
          {
            property: 'Language',
            select: {
              equals: 'Both'
            }
          }
        ]
      }
    ];

    if (category) {
      filters.push({
        property: 'Category',
        select: {
          equals: category
        }
      });
    }

    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: NOTION_HEADERS,
      body: JSON.stringify({
        filter: { and: filters },
        sorts: [
          {
            property: 'Date',
            direction: 'descending'
          }
        ]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Notion API] Query failed: ${res.status} ${errText}`);
      return [];
    }

    const data = await res.json();
    return (data.results || []).map(page => {
      const props = page.properties;
      return {
        id: page.id,
        title: props.Name?.title?.[0]?.plain_text || 'Chưa có tiêu đề',
        slug: props.Slug?.rich_text?.[0]?.plain_text || page.id,
        category: props.Category?.select?.name || 'Chung',
        categoryColor: props.Category?.select?.color || 'default',
        date: props.Date?.date?.start || new Date().toISOString().split('T')[0],
        summary: props.Summary?.rich_text?.[0]?.plain_text || '',
        featuredImage: props.FeaturedImage?.url || null,
        language: props.Language?.select?.name || 'VI'
      };
    });
  } catch (err) {
    console.error('[Notion API] Error querying database:', err);
    return [];
  }
}

export async function getArticleBySlug(slug) {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: NOTION_HEADERS,
      body: JSON.stringify({
        filter: {
          and: [
            {
              property: 'Slug',
              rich_text: {
                equals: slug
              }
            },
            {
              property: 'Published',
              checkbox: {
                equals: true
              }
            },
            {
              or: [
                {
                  property: 'Language',
                  select: {
                    equals: 'VI'
                  }
                },
                {
                  property: 'Language',
                  select: {
                    equals: 'Both'
                  }
                }
              ]
            }
          ]
        }
      })
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      return null;
    }

    const page = data.results[0];
    const props = page.properties;

    // Fetch page blocks (content)
    const blocksRes = await fetch(`https://api.notion.com/v1/blocks/${page.id}/children?page_size=100`, {
      headers: NOTION_HEADERS
    });

    const blocksData = blocksRes.ok ? await blocksRes.json() : { results: [] };

    return {
      id: page.id,
      title: props.Name?.title?.[0]?.plain_text || 'Chưa có tiêu đề',
      slug: props.Slug?.rich_text?.[0]?.plain_text || page.id,
      category: props.Category?.select?.name || 'Chung',
      date: props.Date?.date?.start || '',
      summary: props.Summary?.rich_text?.[0]?.plain_text || '',
      featuredImage: props.FeaturedImage?.url || null,
      blocks: blocksData.results || []
    };
  } catch (err) {
    console.error(`[Notion API] Error fetching article by slug ${slug}:`, err);
    return null;
  }
}

export function renderRichText(richTextArray) {
  if (!richTextArray || richTextArray.length === 0) return '';
  return richTextArray.map(t => {
    let text = t.plain_text;
    if (t.annotations?.bold) text = `<strong>${text}</strong>`;
    if (t.annotations?.italic) text = `<em>${text}</em>`;
    if (t.annotations?.code) text = `<code>${text}</code>`;
    if (t.href) text = `<a href="${t.href}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 underline">${text}</a>`;
    return text;
  }).join('');
}

export function renderBlockToHtml(block) {
  const type = block.type;
  switch (type) {
    case 'paragraph':
      const pText = renderRichText(block.paragraph?.rich_text);
      return pText ? `<p class="mb-4 text-slate-300 leading-relaxed text-base">${pText}</p>` : '<br/>';
    case 'heading_1':
      return `<h2 class="text-2xl sm:text-3xl font-bold text-white mt-8 mb-4 border-b border-slate-700 pb-2">${renderRichText(block.heading_1?.rich_text)}</h2>`;
    case 'heading_2':
      return `<h3 class="text-xl sm:text-2xl font-semibold text-emerald-400 mt-6 mb-3">${renderRichText(block.heading_2?.rich_text)}</h3>`;
    case 'heading_3':
      return `<h4 class="text-lg sm:text-xl font-medium text-amber-300 mt-5 mb-2">${renderRichText(block.heading_3?.rich_text)}</h4>`;
    case 'bulleted_list_item':
      return `<li class="ml-6 list-disc text-slate-300 mb-2">${renderRichText(block.bulleted_list_item?.rich_text)}</li>`;
    case 'numbered_list_item':
      return `<li class="ml-6 list-decimal text-slate-300 mb-2">${renderRichText(block.numbered_list_item?.rich_text)}</li>`;
    case 'callout':
      const icon = block.callout?.icon?.emoji || '💡';
      return `<div class="p-4 my-4 bg-slate-800/80 border-l-4 border-emerald-500 rounded-r-lg text-slate-200 flex items-start space-x-3"><span class="text-2xl">${icon}</span><div>${renderRichText(block.callout?.rich_text)}</div></div>`;
    case 'quote':
      return `<blockquote class="p-4 my-4 border-l-4 border-amber-400 bg-slate-800/40 italic text-slate-300">${renderRichText(block.quote?.rich_text)}</blockquote>`;
    case 'code':
      return `<pre class="p-4 my-4 bg-slate-950 rounded-lg overflow-x-auto text-emerald-300 text-sm font-mono border border-slate-800"><code>${renderRichText(block.code?.rich_text)}</code></pre>`;
    case 'image':
      const src = block.image?.file?.url || block.image?.external?.url || '';
      const caption = block.image?.caption?.[0]?.plain_text || '';
      return `<figure class="my-6"><img src="${src}" alt="${caption}" class="w-full rounded-xl shadow-lg border border-slate-800" />${caption ? `<figcaption class="text-center text-xs text-slate-400 mt-2">${caption}</figcaption>` : ''}</figure>`;
    case 'divider':
      return `<hr class="my-8 border-slate-800" />`;
    default:
      return '';
  }
}
