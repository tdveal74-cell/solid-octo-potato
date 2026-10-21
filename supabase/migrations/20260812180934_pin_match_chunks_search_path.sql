-- A function with a mutable search_path resolves its table references against
-- whatever the caller's search_path happens to be. A caller who can create a
-- table in an earlier schema can shadow knowledge_chunks or knowledge_documents
-- and make this function read theirs instead. Pinning it removes the vector.
create or replace function match_chunks(
  query_embedding vector(1536),
  match_count int default 8,
  filter_owner uuid default null
)
returns table (
  chunk_id uuid,
  document_id uuid,
  content text,
  similarity float
)
language sql
stable
set search_path = public
as $$
  select
    kc.id,
    kc.document_id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity
  from knowledge_chunks kc
  join knowledge_documents kd on kd.id = kc.document_id
  where filter_owner is null or kd.owner_id = filter_owner
  order by kc.embedding <=> query_embedding
  limit match_count
$$;
