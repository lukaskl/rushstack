import React, { useCallback, useEffect, useState } from 'react';
import styles from './styles.scss';
import appStyles from '../../App.scss';
import { IDependencyType, LockfileDependency } from '../../parsing/LockfileDependency';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { pushToStack, selectCurrentEntry } from '../../store/slices/entrySlice';
import { ReactNull } from '../../types/ReactNull';
import { LockfileEntry } from '../../parsing/LockfileEntry';

enum InfluencerTypes {
  Determinant,
  TransitiveReferrer
}

interface IInfluencerType {
  entry: LockfileEntry;
  type: InfluencerTypes;
}

export const LockfileEntryDetailsView = (): JSX.Element | ReactNull => {
  const selectedEntry = useAppSelector(selectCurrentEntry);
  const dispatch = useAppDispatch();

  const [inspectDependency, setInspectDependency] = useState<LockfileDependency | null>(null);
  const [influencers, setInfluencers] = useState<IInfluencerType[]>([]);

  useEffect(() => {
    if (selectedEntry) {
      setInspectDependency(null);
    }
  }, [selectedEntry]);

  const selectResolvedEntry = useCallback(
    (dependencyToTrace) => () => {
      if (inspectDependency && inspectDependency.name === dependencyToTrace.name) {
        if (dependencyToTrace.resolvedEntry) {
          dispatch(pushToStack(dependencyToTrace.resolvedEntry));
        } else {
          console.error('No resolved entry for dependency: ', dependencyToTrace);
        }
      } else if (selectedEntry) {
        setInspectDependency(dependencyToTrace);
        // calculate influencers
        const stack = [selectedEntry];
        const determinants = new Set<LockfileEntry>();
        const transitiveReferrers = new Set<LockfileEntry>();
        const visitedNodes = new Set<LockfileEntry>();
        visitedNodes.add(selectedEntry);
        while (stack.length) {
          const currEntry = stack.pop();
          if (currEntry) {
            for (const reference of currEntry.referencers) {
              let hasDependency = false;
              for (const dependency of reference.dependencies) {
                if (dependency.name === dependencyToTrace.name) {
                  determinants.add(reference);
                  hasDependency = true;
                  break;
                }
              }
              if (!hasDependency) {
                if (reference.transitivePeerDependencies.has(dependencyToTrace.name)) {
                  transitiveReferrers.add(reference);
                } else {
                  // Since this referrer does not declare "dependency", it is a
                  // transitive peer dependency, and we call the referrer a "transitive referrer".
                  // PNPM should have added it to the "transitivePeerDependencies" list in the
                  // YAML file.  If not, either something is wrong with our algorithm, or else
                  // something has changed about how PNPM manages its "transitivePeerDependencies"
                  // field.
                  console.error(
                    'Error analyzing influencers: A referrer appears to be missing its "transitivePeerDependencies" field in the YAML file: ',
                    reference
                  );
                }
                for (const referencer of currEntry.referencers) {
                  if (!visitedNodes.has(referencer)) {
                    stack.push(referencer);
                    visitedNodes.add(referencer);
                  }
                }
              }
            }
          }
        }
        const influencers: IInfluencerType[] = [];
        for (const determinant of determinants.values()) {
          influencers.push({
            entry: determinant,
            type: InfluencerTypes.Determinant
          });
        }
        for (const referrer of transitiveReferrers.values()) {
          influencers.push({
            entry: referrer,
            type: InfluencerTypes.TransitiveReferrer
          });
        }
        setInfluencers(influencers);
      }
    },
    [selectedEntry, inspectDependency]
  );

  const selectResolvedReferencer = useCallback(
    (referencer) => () => {
      dispatch(pushToStack(referencer));
    },
    [selectedEntry]
  );

  const renderPeerDependencies = (): JSX.Element | ReactNull => {
    if (!selectedEntry) return ReactNull;
    const peerDeps = selectedEntry.dependencies.filter(
      (d) => d.dependencyType === IDependencyType.PEER_DEPENDENCY
    );
    if (!peerDeps.length) {
      return (
        <div className={appStyles.ContainerCard}>
          <h5>No peer dependencies.</h5>
        </div>
      );
    }
    if (!inspectDependency || inspectDependency.dependencyType !== IDependencyType.PEER_DEPENDENCY) {
      return (
        <div>
          <h5>Select a peer dependency to view its influencers</h5>
        </div>
      );
    }

    return (
      <div className={appStyles.ContainerCard}>
        <h5>Influencers:</h5>
        {influencers
          .filter((inf) => inf.type === InfluencerTypes.Determinant)
          .map(({ entry }) => (
            <div key={entry.rawEntryId}>{entry.displayText}</div>
          ))}
        <h5>Transitive Referencers:</h5>
        {influencers
          .filter((inf) => inf.type === InfluencerTypes.TransitiveReferrer)
          .map(({ entry }) => (
            <div key={entry.rawEntryId}>{entry.displayText}</div>
          ))}
      </div>
    );
  };

  if (!selectedEntry) {
    return (
      <div className={appStyles.ContainerCard}>
        <h5>Select an entry to view its details</h5>
      </div>
    );
  }

  return (
    <>
      <div className={styles.LockfileEntryListView}>
        <div className={appStyles.ContainerCard}>
          <h5>Direct Referrers</h5>
          <div className={styles.DependencyListWrapper}>
            {selectedEntry.referencers?.map((referencer: LockfileEntry) => (
              <div
                className={styles.DependencyItem}
                key={referencer.rawEntryId}
                onClick={selectResolvedReferencer(referencer)}
              >
                <h5>Name: {referencer.displayText}</h5>
                <div>
                  <p>Entry ID: {referencer.rawEntryId}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={appStyles.ContainerCard}>
          <h5>Direct Dependencies</h5>
          <div className={styles.DependencyListWrapper}>
            {selectedEntry.dependencies?.map((dependency: LockfileDependency) => (
              <div
                className={`${styles.DependencyItem} ${
                  inspectDependency?.name === dependency.name && styles.SelectedDependencyItem
                }`}
                key={dependency.entryId || dependency.name}
                onClick={selectResolvedEntry(dependency)}
              >
                <h5>
                  Name: {dependency.name}{' '}
                  {dependency.dependencyType === IDependencyType.PEER_DEPENDENCY
                    ? `${
                        dependency.peerDependencyMeta.optional ? '(Optional)' : '(Non-optional)'
                      } Peer Dependency`
                    : ''}
                </h5>
                <div>
                  <p>Version: {dependency.version}</p>
                  <p>Entry ID: {dependency.entryId}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {renderPeerDependencies()}
    </>
  );
};
