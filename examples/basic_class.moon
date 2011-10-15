class Inventory
  new: =>
    @items = {}

  add_item: (name, amount=1) =>
    if @items[name]
      @items[name] += amount
    else
      @items[name] = amount

  show: =>
    for item, count in pairs @items
      print item, count

inv = with Inventory!
  \add_item "t-shirt"
  \add_item "pants"
  \add_item "pants"
  \add_item "boots", 4


print "I have:"
inv\show!
