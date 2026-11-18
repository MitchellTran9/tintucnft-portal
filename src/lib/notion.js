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

// Fallback topic images (16:9 high resolution)
const CATEGORY_FALLBACK_IMAGES = {
  'Thị Trường và AI 247': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
  'Hướng Dẫn Về AI': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  'Phân Tích Crypto và Gold': 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=1200&q=80',
  'default': 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80'
};

function extractFeaturedImage(props, page) {
  let img = props.FeaturedImage?.url || null;
  if (!img && props.FeaturedImage?.files?.[0]) {
    img = props.FeaturedImage.files[0].file?.url || props.FeaturedImage.files[0].external?.url || null;
  }
  if (!img && page.cover) {
    img = page.cover.external?.url || page.cover.file?.url || null;
  }
  if (!img) {
    const cat = props.Category?.select?.name || 'default';
    img = CATEGORY_FALLBACK_IMAGES[cat] || CATEGORY_FALLBACK_IMAGES['default'];
  }
  return img;
}

export function isMetadataBlock(block) {
  if (!block) return true;
  const type = block.type;

  // Bỏ qua toggle block (Bộ nội dung đăng đa kênh nội bộ)
  if (type === 'toggle') return true;

  // Kiểm tra paragraph chứa frontmatter key-value thô
  if (type === 'paragraph') {
    const text = (block.paragraph?.rich_text?.map(t => t.plain_text).join('') || '').trim();
    if (!text) return true; // Dòng trống

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const metadataKeyRegex = /^(title|slug|category|date|summary|published|author|tags|language)\s*:/i;

    if (lines.length > 0 && lines.every(l => metadataKeyRegex.test(l))) {
      return true;
    }
    if (metadataKeyRegex.test(text)) {
      return true;
    }
  }

  return false;
}

export function cleanArticleBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];

  // 1. Loại bỏ các khối metadata thô ở bất kỳ đâu
  let filtered = blocks.filter(b => !isMetadataBlock(b));

  // 2. Cắt bỏ các divider hoặc dòng trống ở ngay đầu bài viết trước khi vào nội dung thật
  while (filtered.length > 0) {
    const first = filtered[0];
    if (first.type === 'divider') {
      filtered.shift();
      continue;
    }
    if (first.type === 'paragraph') {
      const text = (first.paragraph?.rich_text?.map(t => t.plain_text).join('') || '').trim();
      if (!text) {
        filtered.shift();
        continue;
      }
    }
    break;
  }

  return filtered;
}

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
        featuredImage: extractFeaturedImage(props, page),
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
    const rawBlocks = blocksData.results || [];
    const cleanedBlocks = cleanArticleBlocks(rawBlocks);

    return {
      id: page.id,
      title: props.Name?.title?.[0]?.plain_text || 'Chưa có tiêu đề',
      slug: props.Slug?.rich_text?.[0]?.plain_text || page.id,
      category: props.Category?.select?.name || 'Chung',
      date: props.Date?.date?.start || '',
      summary: props.Summary?.rich_text?.[0]?.plain_text || '',
      featuredImage: extractFeaturedImage(props, page),
      blocks: cleanedBlocks
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
    if (t.annotations?.code) text = `<code class="bg-slate-800 text-emerald-400 px-1 py-0.5 rounded text-xs font-mono">${text}</code>`;
    if (t.href) text = `<a href="${t.href}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 underline hover:text-emerald-300 transition-colors">${text}</a>`;
    return text;
  }).join('');
}

export function renderBlockToHtml(block) {
  if (isMetadataBlock(block)) {
    return '';
  }

  const type = block.type;
  switch (type) {
    case 'paragraph':
      const pText = renderRichText(block.paragraph?.rich_text);
      return pText ? `<p class="mb-5 text-slate-300 leading-relaxed text-base">${pText}</p>` : '';
    case 'heading_1':
      return `<h2 class="text-2xl sm:text-3xl font-extrabold text-white mt-10 mb-4 border-b border-slate-800 pb-3">${renderRichText(block.heading_1?.rich_text)}</h2>`;
    case 'heading_2':
      return `<h3 class="text-xl sm:text-2xl font-bold text-white mt-8 mb-3 bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">${renderRichText(block.heading_2?.rich_text)}</h3>`;
    case 'heading_3':
      return `<h4 class="text-lg sm:text-xl font-bold text-amber-300 mt-6 mb-2">${renderRichText(block.heading_3?.rich_text)}</h4>`;
    case 'bulleted_list_item':
      return `<li class="ml-6 list-disc text-slate-300 mb-2.5 leading-relaxed">${renderRichText(block.bulleted_list_item?.rich_text)}</li>`;
    case 'numbered_list_item':
      return `<li class="ml-6 list-decimal text-slate-300 mb-2.5 leading-relaxed">${renderRichText(block.numbered_list_item?.rich_text)}</li>`;
    case 'callout':
      const icon = block.callout?.icon?.emoji || '💡';
      return `<div class="p-5 my-6 bg-slate-900/90 border border-emerald-500/30 rounded-2xl text-slate-200 flex items-start space-x-3.5 shadow-lg"><span class="text-2xl leading-none">${icon}</span><div class="text-sm sm:text-base leading-relaxed">${renderRichText(block.callout?.rich_text)}</div></div>`;
    case 'quote':
      return `<blockquote class="p-5 my-6 border-l-4 border-amber-400 bg-amber-950/20 rounded-r-2xl italic text-slate-300 text-base leading-relaxed">${renderRichText(block.quote?.rich_text)}</blockquote>`;
    case 'code':
      return `<pre class="p-4 my-6 bg-slate-950 rounded-xl overflow-x-auto text-emerald-300 text-sm font-mono border border-slate-800"><code>${renderRichText(block.code?.rich_text)}</code></pre>`;
    case 'image':
      const src = block.image?.file?.url || block.image?.external?.url || '';
      if (!src) return '';
      const caption = block.image?.caption?.[0]?.plain_text || '';
      return `<figure class="my-8"><img src="${src}" alt="${caption || 'Minh họa bài viết'}" class="w-full rounded-2xl shadow-xl border border-slate-800 object-cover max-h-[550px]" loading="lazy" />${caption ? `<figcaption class="text-center text-xs text-slate-400 mt-2 italic">${caption}</figcaption>` : ''}</figure>`;
    case 'divider':
      return `<hr class="my-10 border-slate-800" />`;
    default:
      return '';
  }
}
