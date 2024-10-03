#!/bin/bash

# Leer la versión actual de proyecto
version=$(cat VERSION.txt)

# Incrementar la versión según el tipo (major, minor, patch)
increment_version() {
  local delimiter=.
  local array=($(echo "$1" | tr $delimiter '\n'))
  local major=${array[0]}
  local minor=${array[1]}
  local patch=${array[2]}

  case $2 in
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    patch)
      patch=$((patch + 1))
      ;;
    *)
      echo "Usage: $0 {major|minor|patch}"
      exit 1
      ;;
  esac

  new_version="${major}.${minor}.${patch}"
  echo "$new_version"
}

# Incrementar la versión
new_version=$(increment_version $version $1)

# Actualizar el archivo de versión
echo $new_version > VERSION.txt

# Mostrar la versión actualizada
echo "Bumped version to $new_version"