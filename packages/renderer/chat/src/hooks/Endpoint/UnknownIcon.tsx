import { memo } from 'react';
import { EModelEndpoint, KnownEndpoints } from 'librechat-data-provider';
import { CustomMinimalIcon, XAIcon } from '~/components/svg';
import { IconContext } from '~/common';
import { cn } from '~/utils';
const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

const knownEndpointAssets = {
  [KnownEndpoints.anyscale]: `${baseUrl}/assets/anyscale.png`,
  [KnownEndpoints.apipie]: `${baseUrl}/assets/apipie.png`,
  [KnownEndpoints.cohere]: `${baseUrl}/assets/cohere.png`,
  [KnownEndpoints.deepseek]: `${baseUrl}/assets/deepseek.svg`,
  [KnownEndpoints.fireworks]: `${baseUrl}/assets/fireworks.png`,
  [KnownEndpoints.groq]: `${baseUrl}/assets/groq.png`,
  [KnownEndpoints.huggingface]: `${baseUrl}/assets/huggingface.svg`,
  [KnownEndpoints.mistral]: `${baseUrl}/assets/mistral.png`,
  [KnownEndpoints.mlx]: `${baseUrl}/assets/mlx.png`,
  [KnownEndpoints.ollama]: `${baseUrl}/assets/ollama.png`,
  [KnownEndpoints.openrouter]: `${baseUrl}/assets/openrouter.png`,
  [KnownEndpoints.perplexity]: `${baseUrl}/assets/perplexity.png`,
  // @ts-ignore
  [KnownEndpoints.requesty]: `${baseUrl}/assets/requesty.ico`,
  [KnownEndpoints.shuttleai]: `${baseUrl}/assets/shuttleai.png`,
  [KnownEndpoints['together.ai']]: `${baseUrl}/assets/together.png`,
  [KnownEndpoints.unify]: `${baseUrl}/assets/unify.webp`,
};

const knownEndpointClasses = {
  [KnownEndpoints.cohere]: {
    [IconContext.landing]: 'p-2',
  },
  [KnownEndpoints.xai]: {
    [IconContext.landing]: 'p-2',
  },
};

const getKnownClass = ({
  currentEndpoint,
  context = '',
  className,
}: {
  currentEndpoint: string;
  context?: string;
  className: string;
}) => {
  if (currentEndpoint === KnownEndpoints.openrouter) {
    return className;
  }

  const match = knownEndpointClasses[currentEndpoint]?.[context] ?? '';
  const defaultClass = context === IconContext.landing ? '' : className;

  return cn(match, defaultClass);
};

function UnknownIcon({
  className = '',
  endpoint: _endpoint,
  iconURL = '',
  context,
}: {
  iconURL?: string;
  className?: string;
  endpoint?: EModelEndpoint | string | null;
  context?: 'landing' | 'menu-item' | 'nav' | 'message';
}) {
  const endpoint = _endpoint ?? '';
  if (!endpoint) {
    return <CustomMinimalIcon className={className} />;
  }

  const currentEndpoint = endpoint.toLowerCase();

  if (currentEndpoint === KnownEndpoints.xai) {
    return (
      <XAIcon
        className={getKnownClass({
          currentEndpoint,
          context: context,
          className,
        })}
      />
    );
  }

  if (iconURL) {
    return <img className={className} src={iconURL} alt={`${endpoint} Icon`} />;
  }

  const assetPath: string = knownEndpointAssets[currentEndpoint] ?? '';

  if (!assetPath) {
    return <CustomMinimalIcon className={className} />;
  }

  return (
    <img
      className={getKnownClass({
        currentEndpoint,
        context: context,
        className,
      })}
      src={assetPath}
      alt={`${currentEndpoint} Icon`}
    />
  );
}

export default memo(UnknownIcon);
