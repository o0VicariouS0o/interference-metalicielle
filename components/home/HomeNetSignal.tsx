export function HomeNetSignal() {
  return (
    <div
      className="homeNetSignal"
      aria-hidden="true"
    >
      <div className="homeNetSignal__grid" />

      <span className="homeNetSignal__line homeNetSignal__line--one">
        <span className="homeNetSignal__packet homeNetSignal__packet--one" />
      </span>

      <span className="homeNetSignal__line homeNetSignal__line--two">
        <span className="homeNetSignal__packet homeNetSignal__packet--two" />
      </span>

      <span className="homeNetSignal__line homeNetSignal__line--three">
        <span className="homeNetSignal__packet homeNetSignal__packet--three" />
      </span>

      <span className="homeNetSignal__line homeNetSignal__line--four">
        <span className="homeNetSignal__packet homeNetSignal__packet--four" />
      </span>

      <span className="homeNetSignal__pulse homeNetSignal__pulse--one" />
      <span className="homeNetSignal__pulse homeNetSignal__pulse--two" />

      <span className="homeNetSignal__node homeNetSignal__node--main" />
      <span className="homeNetSignal__node homeNetSignal__node--north" />
      <span className="homeNetSignal__node homeNetSignal__node--east" />
      <span className="homeNetSignal__node homeNetSignal__node--south" />
      <span className="homeNetSignal__node homeNetSignal__node--west" />

      <span className="homeNetSignal__label homeNetSignal__label--main">
        Nœud central
      </span>

      <span className="homeNetSignal__label homeNetSignal__label--data">
        Relations actives
      </span>

      <span className="homeNetSignal__sync">
        <span className="homeNetSignal__syncDot" />
        Synchronisation active
      </span>
    </div>
  );
}