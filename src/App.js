import React, {useState, useEffect} from 'react'
import {withAuthenticator} from 'aws-amplify-react'
import {API, graphqlOperation} from 'aws-amplify'
import {createNote, deleteNote, updateNote}  from './graphql/mutations'
import {onCreateNote, onUpdateNote, onDeleteNote}  from './graphql/subscriptions'
import {listNotes}  from './graphql/queries'


const App=()=> {

  const [notes, setNotes] = useState([])
  const [id, setId] = useState("")
  const [note, setNote] = useState("")

  const getNotes=async()=>{
    const res = await API.graphql(graphqlOperation(listNotes))
    setNotes(prevNotes => res.data.listNotes.items)
  }

  useEffect(()=>{
    getNotes()

    const createListener =  API.graphql(graphqlOperation(onCreateNote))
      .subscribe({
        next: noteData => {
          const newNote = noteData.value.data.onCreateNote
          const prevNotes = notes.filter(note =>note.id !== newNote.id)
          const updatedNotes = [...prevNotes, newNote]
          setNotes(updatedNotes)
        }
      })

      const deleteListener =  API.graphql(graphqlOperation(onDeleteNote))
      .subscribe({
        next: noteData => {
          const deletedNote = noteData.value.data.onDeleteNote
          const updatedNotes = notes.filter(note =>note.id !== deletedNote.id)
          setNotes(updatedNotes)
        }
      })

      const updateListener =  API.graphql(graphqlOperation(onUpdateNote))
      .subscribe({
        next: noteData => {
          const updatedNote = noteData.value.data.onUpdateNote
          const index = notes.findIndex(note => note.id === updatedNote.id)
          const updatedNotes = [
            ...notes.slice(0, index), updatedNote, ...notes.slice(index+1)
          ]
          setNotes(updatedNotes)
          setId("")
          setNote("")
        }
      })

    return ()=>{
      createListener.unsubscribe()
      updateListener.unsubscribe()
      deleteListener.unsubscribe()
    }
  })

  const handleChangeNote = (e) => {
    setNote(e.target.value)
  }

  const hasExistingNote = ()=>{
    if(id){
     const index = notes.findIndex(note => note.id === id) > -1
     return index
    }
    return false
  }

  const handleUpdateNote = async()=>{
    const input ={
      id, note
    }
    const res = await API.graphql(graphqlOperation(updateNote, {input}))
    const updatedNote = res.data.updateNode
    const index = notes.findIndex(note => note.id === updatedNote.id)
    const updatedNotes = [
      ...notes.slice(0, index), updatedNote, ...notes.slice(index+1)
    ]
    setNotes(updatedNotes)
    setId("")
    setNote("")
  }

  const handleNote = async (e) => {
    e.preventDefault()
    if(hasExistingNote()){
      return handleUpdateNote()
    }
    const input = {note}
    const res = await API.graphql(graphqlOperation(createNote, {input}))
    const newNote = res.data.createNote
    const updatedNotes = [newNote, ...notes]
    setNotes(updatedNotes)      
    setNote("")
  }

  
  const handleDeleteNote = async(id)=>{
    const input ={id}
    const res = await API.graphql(graphqlOperation(deleteNote, {input}))
    const deletedNoteId = res.data.deleteNote.id
    const updatedNotes = notes.filter(note=>note.id !== deletedNoteId)
    setNotes(updatedNotes)
  }
  const handleSetNote = (item)=>{
          let {note, id} = item
          setId(id)
          setNote(note)
  }

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-l">Amplify Notetaker</h1>
      <form className="mb3" onSubmit={handleNote}>
        <input type="text" name="note" className="pa2 f4" 
        onChange={handleChangeNote}
        value={note}      
        placeholder="Write your note"/>
        <button className="pa2 f4" type="submit">
          {id ? "Update Note" : "Add Note"}
        </button>
      </form>
      <div>
        {notes.map(item => {
          return <div key={item.id} className="flex items-center">
            <li onClick={()=> handleSetNote(item)} className="list pa1 f3">{item.note}</li>
            <button onClick={()=>handleDeleteNote(item.id)} className="bg-transparent bn f4">
              <span>&times;</span>
            </button>
          </div>
        })}
      </div>
    </div>
  );
}

export default withAuthenticator(App, {includeGreetings: true});
