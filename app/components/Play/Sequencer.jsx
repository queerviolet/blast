import React from 'react'
import PropTypes from 'prop-types'
import Tone from 'tone'

class Transport extends React.Component {
  getChildContext() {
    return {transport: Tone.Transport}
  }

  componentDidMount() { this.loadProps(this.props) }

  componentWillReceiveProps(incoming, outgoing) {
    this.loadProps(incoming)
  }

  loadProps({
    isPlaying=false,
    loop=false,
    loopEnd,
    bpm=120,
  }) {
    const {Transport} = Tone

    if (isPlaying) {
      Transport.start()
    } else {
      Transport.stop()
    }

    Transport.loop = loop
    Transport.loopEnd = loopEnd
    Transport.bpm.value = bpm
  }

  render() {
    return <div>{this.props.children}</div>
  }
}

const timeT = PropTypes.oneOfType([
  PropTypes.number,
  PropTypes.string,
])

Transport.propTypes = {
  isPlaying: PropTypes.bool,
  loop: PropTypes.oneOfType([
    PropTypes.bool,
    timeT
  ]),
  loopEnd: timeT,
}

Transport.childContextTypes = {
  transport: PropTypes.object,
}

class Voice extends React.Component {
  getChildContext() {
    return {schedule: this.schedule, clear: this.clear}
  }

  componentDidMount() {
    this.synth = new Tone.PluckSynth().toMaster()
    this.synth.resonance.value = 1.5
  }

  get tx() { return this.context.transport }

  play = (note, duration, velocity) => time =>
    this.synth.triggerAttackRelease(note, duration, time, velocity)

  schedule = (note, time, duration, velocity) =>
    this.tx.schedule(this.play(note, duration, velocity), time)

  clear = id => this.tx.clear(id)

  render() {
    return <div>{this.props.children}</div>
  }
}

Voice.contextTypes = Transport.childContextTypes

Voice.childContextTypes = {
  schedule: PropTypes.func,
  clear: PropTypes.func,
}

const {is, fromJS} = require('immutable')

class Note extends React.Component {
  componentDidMount() {
    this.loadProps(this.props)
  }

  componentWillReceiveProps(incoming, outgoing) {
    if (!is(fromJS(incoming), fromJS(outgoing))) {
      this.loadProps(incoming)
    }
  }

  loadProps({note, time, duration, velocity}) {
    if (this.eventId) {
      this.context.clear(this.eventId)
    }
    this.context.schedule(note, time, duration, velocity)
  }

  render() { return null }
}
Note.contextTypes = Voice.childContextTypes

export default class extends React.Component {
  componentDidMount() {
    // When the component mounts, start listening to the fireRef
    // we were given.
    this.listenTo(this.props.fireRef)
  }

  componentWillUnmount() {
    // When we unmount, stop listening.
    this.unsubscribe()
  }

  componentWillReceiveProps(incoming, outgoing) {
    // When the props sent to us by our parent component change,
    // start listening to the new firebase reference.
    this.listenTo(incoming.fireRef)
  }

  listenTo(fireRef) {
    // If we're already listening to a ref, stop listening there.
    if (this.unsubscribe) this.unsubscribe()

    // Whenever our ref's value changes, set {value} on our state.
    const listener = fireRef.on('value', snapshot =>
      this.setState({value: snapshot.val()}))

    // Set unsubscribe to be a function that detaches the listener.
    this.unsubscribe = () => fireRef.off('value', listener)
  }

  // Write is defined using the class property syntax.
  // This is roughly equivalent to saying,
  //
  //    this.write = event => (etc...)
  //
  // in the constructor. Incidentally, this means that write
  // is always bound to this.
  write = event => this.props.fireRef &&
    this.props.fireRef.set(event.target.value)

  state = {isPlaying: true, value: ''}

  togglePlaying = evt => this.setState({isPlaying: evt.target.checked})

  render() {
    const {value, isPlaying=true} = this.state || {}
    return (
      <div>
      <input type='checkbox' checked={isPlaying} onChange={this.togglePlaying} />
      <Transport bpm={200} isPlaying={isPlaying} loop={true} loopEnd='2m'>
        <Voice resonance={3}>
          <Note note='C2' time='0:0' duration='8n' velocity={1}/>
          <Note note='D2' time='0:1' duration='8n' />
          <Note note='E2' time='0:2' duration='8n' />
          <Note note='F2' time='0:3' duration='8n' />
          <Note note='G2' time='1:0' duration='8n' />
          <Note note='A2' time='1:1' duration='8n' />
          <Note note='B2' time='1:2' duration='8n' />
          <Note note='C3' time='1:3' duration='8n' />
        </Voice>
        <Voice resonance={3}>
          <Note note='C3' time='0:0' duration='8n' velocity={1}/>
          <Note note='D3' time='0:1' duration='8n' />
          <Note note='E3' time='0:2' duration='8n' />
          <Note note='F3' time='0:3' duration='8n' />
          <Note note='G3' time='1:0' duration='8n' />
          <Note note='A3' time='1:1' duration='8n' />
          <Note note='B3' time='1:2' duration='8n' />
          <Note note='C4' time='1:3' duration='8n' />
        </Voice>
        <Voice resonance={3}>
          <Note note='C4' time='0:0' duration='8n' velocity={1}/>
          <Note note='D4' time='0:1' duration='8n' />
          <Note note='E4' time='0:2' duration='8n' />
          <Note note='F4' time='0:3' duration='8n' />
          <Note note='G4' time='1:0' duration='8n' />
          <Note note='A4' time='1:1' duration='8n' />
          <Note note='B4' time='1:2' duration='8n' />
          <Note note='C5' time='1:3' duration='8n' />
        </Voice>
      </Transport>
      </div>
    )
  }
}
