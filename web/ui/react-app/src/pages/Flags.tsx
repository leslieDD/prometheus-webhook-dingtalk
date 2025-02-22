import React, { FC } from 'react';
import { RouteComponentProps } from '@reach/router';
import { Table } from 'reactstrap';
import { withStatusIndicator } from '../withStatusIndicator';
import { useFetch } from '../utils/useFetch';

interface FlagMap {
  [key: string]: string;
}

interface FlagsProps {
  data?: FlagMap;
}

export const FlagsContent: FC<FlagsProps> = ({ data = {} }) => {
  return (
    <>
      <h2>Command-Line Flags</h2>
      <Table bordered size="sm" striped>
        <tbody>
          {Object.keys(data).map(key => (
            <tr key={key}>
              <th>{key}</th>
              <td>{data[key]}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};
const FlagsWithStatusIndicator = withStatusIndicator(FlagsContent);

FlagsContent.displayName = 'Flags';

const Flags: FC<RouteComponentProps> = () => {
  const { response, error, isLoading } = useFetch<FlagMap>('/api/v1/status/flags');
  return <FlagsWithStatusIndicator data={response.data} error={error} isLoading={isLoading} />;
};

export default Flags;
