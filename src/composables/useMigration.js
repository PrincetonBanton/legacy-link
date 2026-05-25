import { ref } from 'vue'

export function useMigration() {
  // --- STATE ---
  const selectedPath = ref('')
  const isMigrating = ref(false)
  const fileInfo = ref({ name: '' })
  const detectedType = ref('')
  const mainTableInfo = ref({ name: '', columns: [] })
  const migratedTables = ref([])
  const locations = ref([])

  // --- IPC BRIDGE HELPER ---
  const getIpc = () => window.require ? window.require('electron').ipcRenderer : null

  // --- ACTIONS ---
  const handleMdbBrowse = async () => {
    const path = await getIpc()?.invoke('select-file')
    if (path) {
      selectedPath.value = path
      fileInfo.value.name = path.split('\\').pop()
      resetState()
    }
  }

  const handleMdbSync = () => {
    const ipc = getIpc()
    if (!ipc) return

    isMigrating.value = true
    ipc.once('migration-finished', (_, result) => {
      isMigrating.value = false
      if (!result.success) return alert("Error: " + result.error)

      migratedTables.value = result.stats
      detectedType.value = result.dbType
      mainTableInfo.value = { name: result.mainTable, columns: result.schema }
      getAreaLocation()
    })
    ipc.send('save-mdb-path', selectedPath.value)
  }

  const getAreaLocation = async () => {
    const res = await getIpc()?.invoke('get-locations')
    if (res && !res.error) locations.value = res.data
  }

  // --- STATE RESETS ---
  const resetState = () => {
    mainTableInfo.value = { name: '', columns: [] }
    migratedTables.value = []
    detectedType.value = ''
    locations.value = []
  }

  const resetSelection = () => {
    selectedPath.value = ''
    resetState()
  }

  return {
    selectedPath, isMigrating, migratedTables, fileInfo, detectedType, mainTableInfo, locations,
    handleMdbBrowse, handleMdbSync, resetSelection, getAreaLocation
  }
}