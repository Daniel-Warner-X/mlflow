import invariant from 'invariant';
import { useParams } from '../../../common/utils/RoutingUtils';
import ToolRegistryPage from './ToolRegistryPage';

const ExperimentToolRegistryPage = () => {
  const { experimentId } = useParams();
  invariant(experimentId, 'Experiment ID must be defined');

  return <ToolRegistryPage experimentId={experimentId} />;
};

export default ExperimentToolRegistryPage;
