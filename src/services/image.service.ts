import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib'

const getImageObjectUrl = async (path: string) => {
  const res = await apiClient.get<Blob>(path, { responseType: 'blob' })
  return { url: URL.createObjectURL(res.data), size: res.data.size, type: res.data.type }
}

/** Uploads are auth-protected and <img> can't send the Bearer token —
    fetch through the API client and expose the blob as an object URL. */
export const useAuthImage = (path?: string | null) =>
  useQuery({
    queryKey: ['image', path],
    queryFn: () => getImageObjectUrl(path!),
    enabled: !!path,
  })
