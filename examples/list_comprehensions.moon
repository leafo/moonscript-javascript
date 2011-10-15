format = (list) ->
  if type(list) == "table"
    "{" .. table.concat([format item for item in *list], ", ") .. "}"
  else
    list

-- double list of items
items = {1,2,3,4,5}
doubled = [i*2 for i in *items]

print "doubled:", format doubled

-- find points inside of the unit circle

length = (x,y) -> math.sqrt x^2 + y^2

pts = for i=0.5, 1.0, 0.2 do i
inside = [{x,y} for x in *pts for y in *pts when length(x,y) <= 1.0]

print "pts in circle: ", format inside

