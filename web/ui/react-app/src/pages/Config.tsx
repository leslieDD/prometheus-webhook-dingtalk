import React, { FC, useState } from 'react';
import { Button } from 'reactstrap';
import { RouteComponentProps } from '@reach/router';
import CopyToClipboard from 'react-copy-to-clipboard';
import { withStatusIndicator } from '../withStatusIndicator';
import { useFetch } from '../utils/useFetch';

import './Config.css';

type YamlConfig = { yaml?: string };

interface ConfigContentProps {
  error?: Error;
  data?: YamlConfig;
}

const YamlContent = ({ yaml }: YamlConfig) => <pre className="config-yaml">{yaml}</pre>;
YamlContent.displayName = 'Config';

const ConfigWithStatusIndicator = withStatusIndicator(YamlContent);

export const ConfigContent: FC<ConfigContentProps> = ({ error, data }) => {
  const [copied, setCopied] = useState(false);
  const config = data && data.yaml;
  return (
    <>
      <h2>
        Configuration&nbsp;
        <CopyToClipboard
          text={config!}
          onCopy={(_, result) => {
            setCopied(result);
            setTimeout(setCopied, 1500);
          }}
        >
          <Button color="primary" disabled={!config}>
            {copied ? 'Copied' : 'Copy to clipboard'}
          </Button>
        </CopyToClipboard>
      </h2>
      <ConfigWithStatusIndicator error={error} isLoading={!config} yaml={config} />
    </>
  );
};

const Config: FC<RouteComponentProps> = () => {
  const { response, error } = useFetch<YamlConfig>(`/api/v1/status/config`);
  return <ConfigContent error={error} data={response.data} />;
};

export default Config;
