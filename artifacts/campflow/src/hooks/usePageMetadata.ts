import { useEffect } from 'react';

export function usePageMetadata(title: string, description: string) {
  useEffect(() => {
    document.title = title;

    let descriptionMeta = document.querySelector('meta[name="description"]');
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.setAttribute('name', 'description');
      document.head.appendChild(descriptionMeta);
    }

    descriptionMeta.setAttribute('content', description);
  }, [title, description]);
}
